use flume::{Receiver, Sender};
use std::time::Instant;
use tracing::{error, info};

use crate::{
    data::{FFVideo, VideoInfo},
    feeds::{CameraConnection, CameraFeed, RawCameraFrame},
    pipeline::{clock::RealTimeClock, control::Control, task::PipelineSourceTask},
    MediaError,
};

pub struct CameraSource {
    feed_connection: CameraConnection,
    video_info: VideoInfo,
    output: Sender<FFVideo>,
}

impl CameraSource {
    pub fn init(feed: &CameraFeed, output: Sender<FFVideo>) -> Self {
        Self {
            feed_connection: feed.create_connection(),
            video_info: feed.video_info(),
            output,
        }
    }

    pub fn info(&self) -> VideoInfo {
        self.video_info
    }

    fn process_frame(
        &self,
        clock: &mut RealTimeClock<Instant>,
        camera_frame: RawCameraFrame,
    ) -> Result<(), MediaError> {
        let RawCameraFrame {
            mut frame,
            captured_at,
        } = camera_frame;
        match clock.timestamp_for(captured_at) {
            None => {
                eprintln!("Clock is currently stopped. Dropping frames.");
            }
            Some(timestamp) => {
                frame.set_pts(Some(timestamp));
                if let Err(_) = self.output.send(frame) {
                    return Err(MediaError::Any("Pipeline is unreachable! Stopping capture"));
                }
            }
        }

        Ok(())
    }

    fn pause_and_drain_frames(
        &self,
        clock: &mut RealTimeClock<Instant>,
        frames_rx: Receiver<RawCameraFrame>,
    ) {
        let frames: Vec<RawCameraFrame> = frames_rx.drain().collect();
        drop(frames_rx);

        for frame in frames {
            if let Err(error) = self.process_frame(clock, frame) {
                eprintln!("{error}");
                break;
            }
        }
    }
}

impl PipelineSourceTask for CameraSource {
    type Clock = RealTimeClock<Instant>;

    // #[tracing::instrument(skip_all)]
    fn run(
        &mut self,
        mut clock: Self::Clock,
        ready_signal: crate::pipeline::task::PipelineReadySignal,
        mut control_signal: crate::pipeline::control::PipelineControlSignal,
    ) {
        let mut frames_rx: Option<Receiver<RawCameraFrame>> = None;

        info!("Camera source ready");

        let frames = frames_rx.get_or_insert_with(|| self.feed_connection.attach());

        ready_signal.send(Ok(())).unwrap();

        loop {
            match control_signal.last() {
                Some(Control::Play) => match frames.drain().last().or_else(|| frames.recv().ok()) {
                    Some(frame) => {
                        if let Err(error) = self.process_frame(&mut clock, frame) {
                            eprintln!("{error}");
                            break;
                        }
                    }
                    None => {
                        error!("Lost connection with the camera feed");
                        break;
                    }
                },
                Some(Control::Shutdown) | None => {
                    if let Some(rx) = frames_rx.take() {
                        self.pause_and_drain_frames(&mut clock, rx);
                    }
                    info!("Camera source stopped");
                    break;
                }
            }
        }
    }
}
