# Vampire Survivors 설계 노트

장르 기준작. 개발: poncle (Luca Galante). 2022년 정식 출시. 이 프로젝트의 원래 제목도 "Vampire Survivors Style Game Prototype" 이었다.

## 개발 배경

| 사실 | 출처 | 시사점 |
|---|---|---|
| 1인 개발로 시작, itch.io 에서는 주목받지 못하다 Steam 출시 후 유튜버(SplatterCat) 소개로 폭발 | [Barclays games](https://games.barclays/resource-hub/games/industry-insights/how-vampire-survivors-became-a-hit-when-creator-poncle-was-ready-to-give-up), [80.lv](https://80.lv/articles/vampire-survivors-developer-on-its-design-sudden-success) | 작은 범위·빠른 출시·영상으로 전달되는 재미 |
| 일부러 "투박한" 원본의 룩을 유지 ("make it crappier") | [80.lv](https://80.lv/articles/vampire-survivors-developer-on-its-design-sudden-success) | 화려한 그래픽이 핵심이 아님 → 저사양 원칙과 충돌하지 않는다 |
| 에셋 팩으로 시작해 캐슬바니아풍 에셋을 얹으며 방향이 잡힘 | [GoNintendo](https://gonintendo.com/contents/42432-vampire-survivors-dev-says-the-castlevania-influence-was-there-from-day-one) | 정체성은 아트·테마에서 온다 |
| **JavaScript 게임 프레임워크 Phaser 로 개발** → 2023년 Unity 로 이전 (콘솔에서 JS 실행이 어렵고 코드베이스 단일화) | [Phaser Dev Report 2023-07](https://phaser.io/devlogs/279), [GamingOnLinux](https://www.gamingonlinux.com/2023/07/vampire-survivors-switching-to-new-game-engine-on-august-17) | **우리와 같은 웹 기술로 충분히 성공작이 나왔다.** 콘솔 진출 전까지는 웹 스택 유지가 합리적 |
| 이전 후에도 적은 Phaser 식 물리 바디로 다뤄짐 | [coherence 사례 연구](https://stagenext.coherence.io/blog/tradecraft/vampire-survivors-online-coop-case-study) | 이식은 설계를 그대로 끌고 간다 → 지금 구조를 깔끔히 해 두는 이유 |
| 새 메커니즘은 무료 업데이트, 캐릭터·무기·스테이지는 유료 DLC | [Shacknews](https://shacknews.com/article/134437/vampire-survivors-creator-sequel-is-unlikely) | 콘텐츠를 데이터로 추가하기 쉬운 구조가 수익과 직결 |

## 시스템 설계

### 스폰 — 1분 단위 웨이브

- 적은 **1분마다 웨이브**로 정의된다. 웨이브마다 *최소 유지 수*와 *스폰 간격*, 종류가 정해져 있다.
- 살아 있는 적이 **300 이상이면 주기 스폰을 멈추고** 보스·맵 이벤트만 나온다.
  ([Vampire Survivors Wiki — Enemies](https://vampire-survivors.fandom.com/wiki/Enemies))
- 스테이지마다 특정 시각에 보스 (예: Mad Forest 25:00 의 Giant Blue Venus). ([Mad Forest](https://vampire.survivors.wiki/w/Mad_Forest))

→ 우리 게임은 "간격 지수 감소 + 가중치 무작위" 라 **시간대별 체감 설계가 어렵다**. 웨이브 표 방식은
`config.ts` 데이터만으로 리듬을 디자인할 수 있어 업데이트 편의에도 맞다 → [methodology/spawn-and-balance.md](../methodology/spawn-and-balance.md)

### 진화

- 기본 진화: 무기 **최대 레벨(대개 8)** + 짝 패시브 **보유(레벨 무관)** → **보물 상자를 열 때** 진화.
- 상위 진화는 패시브도 최대 레벨 필요, 일부는 무기 2개 합체(유니온).
  ([Prima Games 진화 가이드](https://primagames.com/gaming/vampire-survivors-weapon-evolution-guide), [Pocket Tactics](https://www.pockettactics.com/vampire-survivors/weapons))
- 진화 무기는 **원본보다 확실히 강하다**는 기대가 플레이어에게 있다.

→ 우리 게임은 레벨업 선택지에 진화가 뜨고(상자에서도 가능), 진화 시 Lv1 수치로 돌아가 오히려 약해지는 무기가 있다 → [known-issues KI-01](../direction/known-issues.md#ki-01)

### 레벨업 선택지 조작

리롤·스킵·봉인(밴)을 메타 성장으로 제공해 "운"을 플레이어가 관리하게 한다. 우리 게임은 리롤만 있다.

### 세션 구조

스테이지당 약 30분 생존이 목표이고 끝에 강제 종료 이벤트가 있다. 우리 게임은 무제한 생존 — 목표 시간 도입은 디자인 결정 사항.
