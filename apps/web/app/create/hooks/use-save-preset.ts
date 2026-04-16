"use client";

import * as React from "react";
import useSWR from "swr";

const SAVE_PRESET_KEY = "create:save-preset-dialog-open";

export function useSavePreset() {
  const { data: open = false, mutate: setOpenData } = useSWR<boolean>(SAVE_PRESET_KEY, {
    fallbackData: false,
    revalidateOnFocus: false,
    revalidateIfStale: false,
    revalidateOnReconnect: false,
  });

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      void setOpenData(nextOpen, { revalidate: false });
    },
    [setOpenData],
  );

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "s" && !e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (
          (e.target instanceof HTMLElement && e.target.isContentEditable) ||
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        ) {
          return;
        }

        e.preventDefault();
        void setOpenData(true, { revalidate: false });
      }
    };

    document.addEventListener("keydown", down);
    return () => {
      document.removeEventListener("keydown", down);
    };
  }, [setOpenData]);

  return {
    open,
    setOpen: handleOpenChange,
  };
}

export function useSavePresetTrigger() {
  const { mutate: setOpenData } = useSWR<boolean>(SAVE_PRESET_KEY, {
    fallbackData: false,
    revalidateOnFocus: false,
    revalidateIfStale: false,
    revalidateOnReconnect: false,
  });

  const openSavePreset = React.useCallback(() => {
    void setOpenData(true, { revalidate: false });
  }, [setOpenData]);

  return {
    openSavePreset,
  };
}
