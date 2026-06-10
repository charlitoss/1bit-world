"use client";

import { Modal } from "./ui/Modal";
import { Icon, type IconName } from "./ui/Icon";

const REPO = "https://github.com/charlitoss/1bit-world";

function LinkRow({
  icon,
  label,
  href,
}: {
  icon: IconName;
  label: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel="noreferrer"
      className="btn justify-start gap-3 px-3 py-2.5 text-[11px] font-display uppercase"
    >
      <Icon name={icon} size={16} />
      {label}
    </a>
  );
}

export function AboutModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="About">
      <div className="space-y-4 text-[13px] leading-relaxed">
        <p>
          <span className="font-display uppercase">1bit.world</span> converts
          images into a 1-bit, dithered aesthetic — right in your browser.
        </p>
        <p className="text-ink-2">
          100% client-side. Nothing is uploaded — your images never leave this
          device. Video support is coming next.
        </p>

        <div className="flex flex-col gap-2 pt-1">
          <LinkRow icon="github" label="Source on GitHub" href={REPO} />
          <LinkRow
            icon="message"
            label="Feedback / report a bug"
            href={`${REPO}/issues`}
          />
          <LinkRow
            icon="mail"
            label="Contact"
            href="mailto:cprioglio@gmail.com"
          />
        </div>

        <p className="pt-1 text-center text-[10px] uppercase tracking-wide text-ink-2">
          made with 1bit.world&rsquo;s own dither
        </p>
      </div>
    </Modal>
  );
}
