# 커뮤니티 글 모음 (Community Notes)

개발자 블로그·포럼·커뮤니티 위키·기사에서 모은 글. 각 항목에 **요점**과 **이 프로젝트에 주는 시사점**을 붙였다.
신뢰도: ★★★ 1차 자료/개발자 본인 · ★★ 실무 경험담 · ★ 커뮤니티 의견·요약 (교차 확인 필요)

## 구현·성능

| 글 | 신뢰도 | 요점 | 시사점 |
|---|---|---|---|
| [Conquering Ciros Week 8 — Vampire Survivor-ing and Pooling Enemies](https://gamedev.net/blogs/entry/2277732-conquering-ciros-week-8-vampire-survivor-ing-and-pooling-enemies) (gamedev.net) | ★★ | 적을 기존 풀링 시스템에 편입, 종류별 리스트, 사망 = 비활성화. 보스는 소수라 풀링 안 함 | GC 멈칫이 보이면 투사체·보석부터 풀링 ([canvas-performance](../methodology/canvas-performance.md)) |
| [Conquering Ciros Week 5 — Enemy Spawn-Rate Tools](https://gamedev.net/blogs/entry/2277632-conquering-ciros-week-5-enemy-spawn-rate-tools) | ★★ | 블록·라인 스폰 도입 후 총 스폰량이 의도치 않게 증가 → 그룹별 스폰율을 툴에서 조정 | 웨이브 표 도입 시 "그룹별 수치"를 데이터로 ([spawn-and-balance](../methodology/spawn-and-balance.md)) |
| [itch.io 토론 — 적이 많아지면 1fps](https://itch.io/post/12756916) | ★ | 물량 대신 더 강한 적으로 난이도를 올리자는 제안에 개발자 동의 | 상한(120)을 함부로 올리지 말 것 |
| [Construct 포럼 — moebios 글 모음](https://www.construct.net/en/forum/users/moebios-34541/posts/page-4) | ★ | VS 는 오래 화면 밖에 있는 적을 정리한다는 관찰, 군집 회피(boids)는 ~200 스프라이트에서 느려짐 | 우리 `cullFarEnemies` 유지, 적끼리 밀어내기(분리)를 넣는다면 공간 분할과 함께 |
| [velog — Unity PoolManager](https://velog.io/@kjhdx/Unity-PoolManager), [2D 종스크롤 슈팅 오브젝트 풀링](https://velog.io/@txmay/Unity-2D-종스크롤-슈팅-오브젝트-풀링), [ObjectPool 패턴](https://velog.io/@sejun-2/유니티-오브젝트생성-디자인패턴-ObjectPool) | ★★ | 생성/파괴 반복은 GC 부담 → 미리 만들어 대여·반납, 풀 최대 용량 분리 | 엔진은 달라도 원리 동일 |
| [velog — Unity 입문 팀프로젝트 회고](https://velog.io/@ljun970/Unity-입문-팀프로젝트-6-End) | ★★ | 풀링 전환 후 Awake/Start 초기화가 재사용 시 안 돌아 OnEnable/OnDisable 로 옮김 | 객체를 재사용하면 **모든 상태 초기화** 필수 |
| [인프런 Q&A — 오브젝트 풀 질문](https://www.inflearn.com/community/questions/1537592) | ★ | 풀에서 돌아온 몬스터가 이전 체력 등을 갖고 나오는 문제 → 스폰/반환 시 초기화 | 늑대 `dying`·`gemDropped` 같은 플래그를 재사용 시 꼭 리셋 |
| [탄막 게임 오브젝트 풀링 메모리 최적화 (한국 학술대회 논문)](https://koreascience.kr/article/CFKO202319360806953.pdf) | ★★★ | 수백~수십만 탄환이 생성·제거되는 탄막 게임에서 풀링으로 메모리 최적화 | 투사체 수가 늘어나는 진화형(8연사·8개 투척)에 유효 |
| [Building Vampire Survivors Online Co-Op (coherence)](https://stagenext.coherence.io/blog/tradecraft/vampire-survivors-online-coop-case-study) | ★★ | Unity 이식 후에도 적은 Phaser식 물리 바디로 동작 | 초기 구조가 이식 후까지 남는다 → 지금 구조를 깔끔히 |
| [Phaser Dev Report 2023-07](https://phaser.io/devlogs/279) | ★★★ | VS 가 Phaser→Unity 로 이전: 콘솔에서 JS 실행이 어렵고 코드베이스 단일화 | 웹 스택은 PC/웹엔 충분, 콘솔 계획이 생길 때 재검토 |

## 장르·디자인

| 글 | 신뢰도 | 요점 | 시사점 |
|---|---|---|---|
| [게임제너레이션 — 뱀서라이크: 게이머와 게임의 생존전략](https://www.gamegeneration.or.kr/article/d0bf094f-c889-4550-81aa-6262f112f718) | ★★ | 로그라이트 성장 + 캐주얼 조작, 매직 서바이벌 기원, 탕탕특공대의 스태미나·장비 가챠, 무분별한 모방에 대한 반감 | 우리 수집형 메타는 장기 동기 장치 — 유료화 시 규제 확인 |
| [게임메카 — 뱀서류 게임 5선](https://www.gamemeca.com/view.php?gid=1689714) | ★ | 국내에서 "뱀서류"로 부르는 대표작 소개 | 한국어 명칭: 뱀서류/뱀서라이크 |
| [나무위키 — 뱀서라이크](https://namu.wiki/w/%EB%B1%80%EC%84%9C%EB%9D%BC%EC%9D%B4%ED%81%AC) | ★ | 국내 커뮤니티 위키의 장르 정리, 무한 모드에서 사이클마다 체력·스폰 빈도 상승 | 후반 스케일링 아이디어 |
| [Steam 커뮤니티 — Magic Survival 언급 토론](https://steamcommunity.com/app/1794680/discussions/0/3276942262784814940/?l=italian) | ★ | VS 가 매직 서바이벌에서 영감을 받았다는 이용자 토론 | 출처는 2차 — 위키백과와 교차 확인 |
| [Exploring The: Bullet Heavens (Substack)](https://exploringthegames.substack.com/p/exploring-the-bullet-heavens) | ★★ | 업그레이드 선택이 장르의 정의적 메커니즘, 재미는 숙련보다 발견과 성장감 | 레벨업 카드의 정보 전달(효과 미리보기)이 핵심 UI |
| [Choost Games — Bullet Heaven vs Bullet Hell](https://choostgames.com/blog/bullet-heaven-vs-bullet-hell/) | ★ | 장르 구분과 용어 | 용어 정리 |
| [RogueRanker — Reddit 투표 기반 VS-like 목록](https://rogueranker.com/?p=791) | ★ | Brotato(웨이브·상점), 20MTD(수동 조준) 등 커뮤니티 평 | [레퍼런스 시트](../references/README.md) 비교표 근거 |

## 게임 필

| 글 | 신뢰도 | 요점 | 시사점 |
|---|---|---|---|
| [Game Developer — Is your game juicy enough?](https://www.gamedeveloper.com/design/video-is-your-game-juicy-enough-) | ★★★ | *Juice it or lose it* (GDC Europe 2012) 영상 소개 | [game-feel](../methodology/game-feel.md) |
| [Wayline — The "Juice" Problem](https://www.wayline.io/blog/the-juice-problem-how-exaggerated-feedback-is-harming-game-design) | ★★ | 과한 주스는 설계 약점을 가리고 시각 소음이 된다 | 원작자 취향(또렷함)과 일치 — 이펙트는 짧게 |
| [eastondev — Where does game feel come from](https://eastondev.com/blog/en/posts/dev/20260521-game-feedback-feel/) | ★ | 히트스톱 0.05–0.1초, 피드백 요소별 비중 정리 | 엘리트 처치 등 큰 사건에만 |

## 찾지 못한 것

- velog/tistory 의 "뱀서라이크 처음부터 끝까지" 개발기는 이번 검색에서 확인하지 못했다(검색 결과가 무관한 글 위주).
  다음에 찾을 키워드: "뱀파이어 서바이버즈 모작", "Godot 뱀서라이크", "웨이브 스폰 시스템 구현".
- Reddit r/gamedev 원문 스레드는 직접 열지 못했다 — 요약 사이트(RogueRanker) 경유.
