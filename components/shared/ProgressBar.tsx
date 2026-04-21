"use client";
import { AppProgressBar } from "next-nprogress-bar";

export function ProgressBar() {
  return (
    <AppProgressBar
      height="3px"
      color="#FC4C02"
      options={{ showSpinner: false }}
      shallowRouting
    />
  );
}
