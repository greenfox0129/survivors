# src/game/core/

| 파일 | 역할 |
|---|---|
| `GameEngine.ts` | 메인 루프(requestAnimationFrame + FPS 상한 + 정지 화면), 입력·포커스 상실 시 해제, **레벨업 큐**(`pendingLevelUps`), 플레이어 일시정지(`setUserPaused`), 매니저 통합, 보상 드롭(`dropReward`), 패시브 런타임 효과, 통계/게임오버 콜백 |
| `types.ts` | 엔티티·무기 상태·업그레이드 옵션·`WeaponMods`·`GameStats` 공용 타입. 새 무기/장신구 id 는 여기 유니온에 먼저 추가 |
| `storage.ts` | 세이브(localStorage `vs_proto_save`), **스키마 버전 + 마이그레이션**, `updatedAt`, 실행기 디스크 미러 훅(`setSaveMirror`) |
| `settings.ts` | 기기별 설정(그래픽 품질·효과음 볼륨·음소거) — 세이브와 분리, 구독 가능(`subscribeSettings`) |
| `audio.ts` | WebAudio 합성 효과음, 마스터 게인(설정 반영), 음소거면 노드 생성 안 함, 노이즈 버퍼 캐시 |

## Notes

- `STORAGE_KEY` must never change. Structure changes go through `SAVE_SCHEMA_VERSION` + `MIGRATIONS`.
- `updateWeaponMods()` runs every frame (HP-based passive) — keep it cheap.
- dt is clamped to 0.05s → below 20fps game time slows down on purpose (anti-tunneling).
- Level-up flow: XP/treasure → `pendingLevelUps` → `openNextLevelUp()` (pauses, emits stats, `onLevelUp`) →
  UI resets its own state *then* calls `applyUpgrade()` → next pending pick or resume. Empty option pool drops the queue.
- `update()` never touches the canvas, so `scripts/sim.mjs` can run it in Node.
