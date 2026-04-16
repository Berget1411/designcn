"use client";

import { RotateCcw } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { useReset } from "@/app/create/hooks/use-reset";

export function ResetButton({ className }: { className?: string }) {
  const { setShowResetDialog } = useReset();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Reset to defaults"
          className={className}
          onClick={() => setShowResetDialog(true)}
        >
          <RotateCcw className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">Reset</TooltipContent>
    </Tooltip>
  );
}

export function ResetDialog() {
  const { showResetDialog, setShowResetDialog, confirmReset } = useReset();

  return (
    <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Reset to defaults?</AlertDialogTitle>
          <AlertDialogDescription>
            This will reset all customization options to their default values.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirmReset}>Reset</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
