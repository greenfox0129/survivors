# src/game/core/

| 파일 | 역할 |
|---|---|
| `GameEngine.ts` | 메인 루프(requestAnimationFrame + FPS 상한 + 정지 화면), 입력, 모든 매니저 통합, 레벨업 일시정지, 통계/게임오버 콜백, 패시브(`PassiveType`) 런타임 효과 |
| `types.ts` | 엔티티·무기 상태·업그레이드 옵션·`WeaponMods`·`GameStats` 등 공용 타입. 새 무기/장신구 id는 여기 유니온에 먼저 추가 |
| `storage.ts` | 세이브(localStorage `vs_proto_save`) 로드/저장, **스키마 버전 + 마이그레이션**, 실행기 디스크 미러 훅(`setSaveMirror`) |
| `audio.ts` | WebAudio 합성 효과음 (피격·히트·경험치·레벨업·게임오버). 에셋 파일 없음 |

## 주의

- `STORAGE_KEY` 는 바꾸지 않는다. 구조 변경은 `SAVE_SCHEMA_VERSION` + `MIGRATIONS` 로.
- `GameEngine` 은 매 프레임 `updateWeaponMods()` 를 호출한다 (체력 비례 패시브 때문). 무거운 계산을 넣지 말 것.
- dt 는 0.05s 로 클램프된다 → 20fps 미만에서는 게임 시간이 실제보다 느리게 흐른다 (의도된 안전장치).
