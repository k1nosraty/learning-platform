"use client";
import { useEffect, useRef } from "react";
import { designCatalogs } from "../../../packages/contracts/src/design-locales";
import type { Locale } from "../../../packages/domain/src/workspaces/permissions";
import { Icon } from "./icon";
export function ConfirmDialog({
  locale,
  title,
  hint,
  confirm,
  onConfirm,
  onCancel,
}: {
  locale: Locale;
  title: string;
  hint: string;
  confirm: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    cancel = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    cancel.current?.focus();
  }, []);
  return (
    <dialog
      ref={ref}
      className="confirm-dialog"
      aria-labelledby="confirmation-title"
      aria-describedby="confirmation-hint"
      onCancel={onCancel}
    >
      <span className="tile-icon warm">
        <Icon name="shield" />
      </span>
      <h2 id="confirmation-title">{title}</h2>
      <p id="confirmation-hint">{hint}</p>
      <div className="actions">
        <button
          ref={cancel}
          type="button"
          className="secondary"
          onClick={onCancel}
        >
          {designCatalogs[locale].cancel}
        </button>
        <button type="button" className="danger-button" onClick={onConfirm}>
          {confirm}
        </button>
      </div>
    </dialog>
  );
}
