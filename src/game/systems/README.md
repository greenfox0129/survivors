# src/game/systems/

| 파일 | 역할 |
|---|---|
| `WeaponManager.ts` | 보유 무기 목록 + 무기별 런타임 상태 보관. 동작은 `weapons/registry.ts` 에 위임 (획득·레벨업·진화·update·render). 이름/설명/최대 레벨 헬퍼 |
| `AccessoryManager.ts` | 장신구 9종 보유·레벨, 합산 배율(`computeMods`, 피해감소 70% 상한), 레벨별 효과 문구 |
| `upgrades.ts` | 레벨업 선택지 생성 — 진화 우선 노출, 나머지는 [무기 강화/신무기/장신구] 동일 가중치 (`CATEGORY_WEIGHTS`) |
| `traitHelper.ts` | 세이브(캐릭터·별·레벨·특성·돌파) → 게임 시작 배율(`GameModifiers`) 계산 |

선택지 가중치를 바꾸고 싶으면 `upgrades.ts` 의 `CATEGORY_WEIGHTS`, 선택지 개수는 `OPTION_COUNT`.
