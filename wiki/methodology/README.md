# 개발 방법론 (Methodology)

이 프로젝트에 실제로 적용했거나, 다음 단계에서 적용할 기법을 근거와 함께 정리한다.

| 문서 | 핵심 질문 | 이 코드에서 |
|---|---|---|
| [game-loop.md](game-loop.md) | 프레임과 게임 시간을 어떻게 맞추나 | `GameEngine.loop` (가변 dt + 클램프 + FPS 상한) |
| [canvas-performance.md](canvas-performance.md) | 저사양에서 60fps 를 지키려면 | `render/*`, 무기 렌더 함수 |
| [data-driven-design.md](data-driven-design.md) | 콘텐츠를 코드 수정 없이 늘리려면 | `data/*`, `weapons/registry.ts`, `docs:spec` |
| [spawn-and-balance.md](spawn-and-balance.md) | 적 물량·난이도 곡선을 어떻게 설계·검증하나 | `EnemyManager`, `npm run sim` |
| [game-feel.md](game-feel.md) | 타격감을 얼마나, 어떻게 | 효과음, 처치 이펙트, 넉백 |
| [versioning-and-updates.md](versioning-and-updates.md) | 버전·세이브·실행 파일을 어떻게 갱신하나 | `CHANGELOG`, `storage.ts`, `build:exe` |

## 참고 도서·자료 (공통)

- Robert Nystrom, *Game Programming Patterns* (무료 웹판) — Game Loop, Update Method, Object Pool, Spatial Partition, Type Object · https://gameprogrammingpatterns.com/
- Glenn Fiedler, *Fix Your Timestep!* · https://gafferongames.com/post/fix_your_timestep/
- MDN, *Optimizing canvas* · https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
- web.dev, *Improving HTML5 Canvas performance* · https://web.dev/articles/canvas-performance
