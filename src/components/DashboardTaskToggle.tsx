"use client";

import { useRouter } from "next/navigation";
import TaskCompleteToggle from "@/components/TaskCompleteToggle";

interface Props {
  taskId: string;
  status: string;
}

export default function DashboardTaskToggle({ taskId, status }: Props) {
  const router = useRouter();

  return (
    <TaskCompleteToggle
      taskId={taskId}
      status={status}
      onToggled={() => router.refresh()}
    />
  );
}
