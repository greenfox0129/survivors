# public/ — 런타임 정적 에셋

빌드 시 `dist/` 루트로 그대로 복사되고, 원클릭 exe 안에도 포함된다. 코드에서는 `/assets/...` 절대 경로로 참조한다.

| 파일 | 용도 | 출처 / 라이선스 |
|---|---|---|
| `favicon.svg` | 브라우저 탭 아이콘 | 이 저장소에서 제작 |
| `assets/enemy/Wolf.png` | 늑대 적 스프라이트 시트 (4열×14행, 16×16 프레임; 4·5행 걷기, 12·13행 사망) | **원본 Bolt 프로젝트 포함 파일 — 출처 미확인** |
| `assets/weapon/claw.PNG` | 야생의 발톱 베기 이미지 (흑백 반전 후 사용) | **원본 Bolt 프로젝트 포함 파일 — 출처 미확인** |

> ⚠ 출처 미확인 파일은 공개 배포 전에 라이선스를 확인할 것. 교체 후보는 `wiki/design/assets/` (CC0/CC BY).

## 에셋 추가 규칙

- 파일명 대소문자를 코드와 정확히 맞춘다 (exe 내장 리소스는 대소문자를 구분한다).
- 픽셀 아트는 16×16 프레임 계열을 유지한다 (`imageRendering: pixelated`).
- 큰 PNG 대신 작은 스프라이트 시트 1장을 쓰고, 이미지는 지연 로딩한다 (`EnemyManager.getWolfImage` 참고).
- 라이선스는 `wiki/design/assets/CREDITS.md` 에 기록한다.
