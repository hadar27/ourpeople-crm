export type ProjectProgressInputs = {
  completedTasks: number;
  totalTasks: number;
  participants: number;
  targetParticipants: number;
  volunteers: number;
  requiredVolunteers: number;
};

const cappedRatio = (actual: number, target: number) =>
  target > 0 ? Math.min(Math.max(actual, 0) / target, 1) : 0;

export function calculateProjectProgress(
  inputs: ProjectProgressInputs,
): number {
  const taskScore = cappedRatio(inputs.completedTasks, inputs.totalTasks) * 50;
  const participantScore =
    cappedRatio(inputs.participants, inputs.targetParticipants) * 25;
  const volunteerScore =
    cappedRatio(inputs.volunteers, inputs.requiredVolunteers) * 25;
  return Math.round(taskScore + participantScore + volunteerScore);
}
