export function pairId(uidA, uidB) {
  return [uidA, uidB].sort().join("_");
}
