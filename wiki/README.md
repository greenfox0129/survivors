# 개발 위키 (Development Wiki)

Survivors Prototype 의 설계·근거·결정을 모아 둔 곳. 코드가 "어떻게"라면 위키는 "무엇을, 왜".
AI 에이전트 작업 규칙은 [AGENTS.md](../AGENTS.md) 가 우선한다.

## 목차

| 섹션 | 내용 | 시작 문서 |
|---|---|---|
| 🧭 **개요** | 이 폴더가 무엇이었고 무엇을 바꿨나, 원작자 의도 대조 | [overview/project-history.md](overview/project-history.md), [overview/original-intent-audit.md](overview/original-intent-audit.md) |
| 📐 **기능 명세** | 게임 시스템 규칙 + 코드에서 자동 생성된 수치표 | [specs/README.md](specs/README.md) |
| 🎮 **레퍼런스** | 장르 대표작 비교 시트, Vampire Survivors 설계 노트, 가챠·규제 | [references/README.md](references/README.md) |
| 🛠 **방법론** | 게임 루프, Canvas 성능, 데이터 주도 설계, 스폰·밸런스, 게임 필, 버전·업데이트 | [methodology/README.md](methodology/README.md) |
| 💬 **커뮤니티** | 개발 커뮤니티 글·기사 큐레이션과 우리 프로젝트에 주는 시사점 | [community/README.md](community/README.md) |
| 🎯 **개발 방향성** | 원칙, 로드맵, 결정 기록, 알려진 이슈 | [direction/README.md](direction/README.md) |
| 🎨 **디자인** | 디자인 시스템, 에셋 적용 지도, 아트 디렉션, 디자인 보드, 크레딧 | [design/README.md](design/README.md) |

## 위키 유지 규칙

1. **수치는 손으로 쓰지 않는다** — `npm run docs:spec` 이 `specs/generated/` 를 만든다. 다른 문서는 거기를 링크한다.
2. **결정은 기록한다** — 방향·우선순위·트레이드오프 결정은 `direction/README.md` 의 결정 기록 표에 한 줄.
3. **출처를 남긴다** — 외부 자료는 링크와 함께 "우리에게 주는 시사점" 한 줄을 붙인다.
4. **에셋은 라이선스와 함께** — `design/assets/CREDITS.md`.
5. 문서 이름은 영어 kebab-case, 본문은 한국어.

## 디렉토리

```
wiki/
├─ overview/       프로젝트 내력
├─ specs/          기능 명세 (+ generated/ 자동 수치표)
├─ references/     레퍼런스 시트·게임별 노트
├─ methodology/    개발 방법론
├─ community/      커뮤니티 글 모음
├─ direction/      개발 방향성·로드맵·알려진 이슈
└─ design/         디자인 시스템·아트 디렉션·에셋·스크린샷
```
