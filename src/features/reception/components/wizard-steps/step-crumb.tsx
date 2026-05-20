interface StepCrumbProps {
  active: boolean;
  done: boolean;
  label: string;
}

export function StepCrumb({ active, done, label }: StepCrumbProps) {
  return (
    <span
      className={
        done
          ? "text-green-600 font-medium"
          : active
            ? "text-foreground font-medium"
            : "text-muted-foreground"
      }
    >
      {label}
    </span>
  );
}
