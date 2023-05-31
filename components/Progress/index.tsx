import { Fade, LinearProgress } from "@mui/material";

type ProgressOptions = {
  wait: boolean;
};

export default function Progress({ wait }: ProgressOptions) {
  return (
    <Fade
    in={wait}
    style={{
      transitionDelay: wait ? '800ms' : '0ms',
    }}
    unmountOnExit
  >
    <LinearProgress />
  </Fade>
  )
}
