const timers = new Map();

function buildKey(quizId, playerId, questionIndex) {
  return `${quizId}:${playerId}:${questionIndex}`;
}

function startTimer(quizId, playerId, questionIndex) {
  const key = buildKey(quizId, playerId, questionIndex);
  timers.set(key, Date.now());
}

function stopTimer(quizId, playerId, questionIndex) {
  const key = buildKey(quizId, playerId, questionIndex);
  const start = timers.get(key);
  if (!start) return null;
  const duration = Date.now() - start;
  timers.delete(key);
  return duration;
}

function clearTimers(quizId) {
  for (const key of timers.keys()) {
    if (key.startsWith(`${quizId}:`)) {
      timers.delete(key);
    }
  }
}

export {
  startTimer,
  stopTimer,
  clearTimers
};
