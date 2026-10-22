# src/game/weapons/

무기 9종의 로직·렌더와, 그것들을 한 표로 묶는 **등록표(`registry.ts`)**.

| 파일 | 무기 | 진화 |
|---|---|---|
| `BulletWeapon.ts` | 라이플 — 가까운 적에게 버스트 연사 | 플라즈마 라이플 |
| `MeleeWeapon.ts` | 근접 회전검 — 주변 궤도 칼날 | 폭풍의 칼날 |
| `BombWeapon.ts` | 폭발탄 — 투하 후 범위 폭발 + 잔류 화염 | 운석 폭격 |
| `TrapWeapon.ts` | 설치형 트랩 — 지속 피해 + 감속 | 영혼의 토템 |
| `AuraWeapon.ts` | 화염 오오라 — 주변 틱 피해 + 화상 | 심판의 화염 |
| `ShurikenWeapon.ts` | 비도 — 관통 투척, 진화 시 부메랑 | 환영 비도. 리냐만 비도 난무(전방위 20) |
| `ClawWeapon.ts` | 야생의 발톱 — 전방 부채꼴 베기 | 브레스 (`BreathWeapon.ts`). 에우로안만 레인보우 브레스 |
| `FistWeapon.ts` | 주먹 — 가까운 적 연타 | 폭권. 연타 뒤 넓은 강타. 천만 벤데타(사거리 300, 가까운 한 명과 무작위 둘) |
| `AxeWeapon.ts` | 양날도끼 — 큰 호를 휘둘러 범위 안을 휩쓴다. Lv7부터 같은 방향으로 두 바퀴 | 학살도끼. 두 바퀴, 범위 1.2배. 칼리만 친우(한 바퀴, 피해 3배, 앞으로 날아가는 반달 충격파) |
| `registry.ts` | `WEAPON_MODULES` 등록표 · `ALL_WEAPON_TYPES` · `weaponLevelEffectAt()` | |

## 무기 모듈 인터페이스 (`WeaponModule<S>`)

```ts
renderOrder        // 작을수록 아래에 그림 (aura 0 … axe 8)
createState(w)     // 획득 시 런타임 상태 생성
onLevelUp?(s, w)   // 레벨업 후 상태 재생성이 필요하면 새 상태 반환
onEvolve?(s, w)    // 진화 후 상태 교체 (발톱 → 브레스처럼)
update(s, args)    // 발사·충돌·정리 (args: enemies, px, py, w, dt, onKill, mods)
render(ctx, s, player, w)
resetGlobals?()    // id 카운터·DoT 맵 등 모듈 전역 초기화
levelEffect(w)     // w.level 도달 시 효과 문구 (레벨업 카드·도감)
```

새 무기 추가 절차는 [AGENTS.md 5장](../../../AGENTS.md#새-무기-추가).

## 렌더링 규칙 (저사양)

- `shadowBlur`·`filter` 를 매 프레임 쓰지 않는다. 큰 그라디언트는 `render/sprites.ts` 의 캐시 스프라이트.
- 장식은 `isLowQuality()` 로 감싸고, 공격 범위 표시처럼 게임 정보는 항상 그린다.
- 투사체 배열은 in-place 컬링(`cull*`)을 유지한다.
