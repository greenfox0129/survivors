# 데이터 주도 설계 (Data-driven Content)

## Type Object 패턴

Nystrom 의 *Type Object*: "종류마다 클래스를 만들지 말고, 종류를 **데이터 객체**로 표현하라."
새 종류를 다시 컴파일 없이(또는 최소 수정으로) 추가할 수 있고, 디자이너가 수치를 직접 고칠 수 있다.
단점은 **종류별 행동**은 데이터만으로 표현하기 어렵다는 것 — 미리 정의된 행동 묶음이나 스크립트가 필요하다.
([Game Programming Patterns — Type Object](https://gameprogrammingpatterns.com/type-object.html))

## 이 프로젝트에서

| 층 | 무엇 | 파일 |
|---|---|---|
| **데이터** (Type Object) | 적 7종, 무기 스탯, 장신구, 캐릭터, 특성, 업적, 진화 | `src/game/data/*.ts` |
| **행동** (미리 정의된 묶음) | 무기 7종의 update/render | `src/game/weapons/*Weapon.ts` |
| **등록** | 행동 ↔ 종류 연결 | `src/game/weapons/registry.ts` (`WEAPON_MODULES`) |
| **표현** | 색·아이콘 | `src/ui/theme.ts`, `src/assets/icons/map.ts` |
| **문서** | 수치표 | `scripts/gen-spec.mjs` → `wiki/specs/generated` |

- 적은 순수 데이터(모양·스탯·등장 시간·가중치)라 `config.ts` 한 줄로 추가된다.
- 무기는 행동이 제각각이라 파일이 필요하지만, `WeaponModule` 인터페이스 덕분에 **다른 곳을 고치지 않는다**.
  `Record<WeaponType, …>` 이라 등록을 빠뜨리면 타입체크가 실패한다.
- JSON 대신 TypeScript 데이터를 쓰는 이유: 타입 검사·자동완성, `as const` 로 오타 방지.
  외부 편집기(시트)가 필요해지면 그때 JSON + 스키마 검증으로 옮긴다.

## 체크리스트 (요약 — 상세는 AGENTS.md 5장)

1. 타입 유니온에 id 추가 → 2. 데이터 추가 → 3. (무기면) 행동 파일 + 등록 → 4. 아이콘 SVG + `map.ts`
→ 5. `npm run check` → 6. `npm run docs:spec` → 7. CHANGELOG

## 피해야 할 것

- 종류별 `switch` 를 여기저기 새로 만드는 것 (원본에는 GameEngine·도감·WeaponManager 에 같은 switch 가 3벌 있었다)
- UI 에 수치를 하드코딩하는 것 — 도감은 데이터·무기 함수에서 읽는다
- 같은 색·아이콘 표를 여러 파일에 복사하는 것 (원본은 장신구 색 표가 3벌)
