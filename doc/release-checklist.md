# Release Checklist

## Vorbereitung

* [ ] release ist auf `develop` vorbereitet
* [ ] `develop` worktree und staging area sind ohne änderungen
  * `git diff --exit-code && git diff --cached --exit-code`
* [ ] `develop` ist auf "seatable zapier app `major.minor.revision`"
  * `git --no-pager show --no-patch --format="%s"`
* [ ] `develop` hat die beschreibung des releases in der commit nachricht
  * `git --no-pager show --no-patch --format="%s%n%n%b"`
* [ ] `CHANGELOG.md` hat `major.minor.revision` mit dem release datum
  * `head -n 3 CHANGELOG.md`
* [ ] `develop` ist fast-forward zu `main`
  * `git merge-base --is-ancestor main develop`

## Erstellung

* [ ] auf `main` wechseln
* [ ] `main` worktree und staging area sind ohne änderungen
* [ ] in `main` die revision vorbereiten
  * `git merge --squash develop`
* [ ] nvm auffrischen
  * `cd .`
* [ ] packet als aktuell markieren
  * `touch package.json`
* [ ] npm auffrischen
  * `make -B package-lock.json`
* [ ] versionen prüfen
  * `npm list`
* [ ] projekt liegt im npm in release version "`major.minor.revision`" vor
* [ ] projekt abhänigkeiten liegen in der für das release freigegeben versionen vor
* [ ] release bauen
  * `make build`
* [ ] release baut
* [ ] release committen
  * `git commit -C develop`
* [ ] release hat die commit message von develop
  * `diff -y <(git show --no-patch --format="# %S:%n%s%n%n%b" develop) <(git show --no-patch --format="# %S:%n%s%n%n%b" main)`
* [ ] release taggen
  * `git tag "$(npm list --json . | jq -r '.version')"`
* [ ] neuestes versions tag liegt in der "`major.minor.revision`" vor
  * `git tag -l '[1-9]*.*.*' | sort -rV | head -n 1`
* [ ] git describe gibt version
  * `git describe --tags`
* [ ] release hochladen
  * `make zapier-upload`
* [ ] prüfung der versionsänderung / des uploads
  * `zapier history | tee >(sleep 0.3; grep -F $(git describe --tags)) | head -n 3`

## Publizieren

* [ ] version publizieren
  * `zapier promote "$(git describe --tags)"`
* [ ] der change-log wurde geprüft
* [ ] der change-log ist abgenommen
* [ ] promotion der version mit change-log war erfolgreich
* [ ] prüfung des uploads
  * `zapier history | tee >(head -n 3) >(sleep .3; grep -F $(git describe --tags)) >/dev/null`
* [ ] `zapier versions` zeigt den wechsel der `production` version an
* [ ] eigenen user migrieren
  * `zapier migrate 2.1.10 2.1.11 --user=tkl@seatable.io`
* [ ] test mit zap in neuer version
  * mit `zapier logs` den manuellen test in neuer version prüfen
* [ ] lauf mit zap in neuer version
  * mit `zapier logs` auf automatische lauffähigkeit des Zaps in neuer version prüfen
* [ ] canary 1% user migration auf die neue version
  * `zapier migrate "$(git describe --tags HEAD~)" "$(git describe --tags)" 1`
  * tracking mit `zapier history | head -n 6` oder `zapier jobs` und `zapier versions`
* [ ] canary 1% überwachen
  * im monitoring auf xdg-open "https://developer.zapier.com/app/$(jq -r '.id' .zapierapprc)/version/$(git describe --tags)/monitoring"
* [ ] 1% canaries können iteriert werden
  * erfordert prüfung auf die anzahl der user
    * die 1. iteration kann einen user haben und
    * die 2. iteration dann nicht und
    * die 3. iteration dann auch wieder keinen user, dann den prozentsatz leicht erhöhen (1% -> 2%) und
    * die 4. iteration kann dann zwei user haben
* [ ] canary 10% user migration auf die neue version
  * `zapier migrate "$(git describe --tags HEAD~)" "$(git describe --tags)" 10`
  * tracking mit `zapier history | head -n 6` und `zapier versions` für die aktiven user auf der neuen version
  * durch den größeren inkrement gibt es das feedback nicht so direkt wie mit den vorherigen canary iterationen
* [ ] canary 10% überwachen
  * im monitoring auf xdg-open "https://developer.zapier.com/app/$(jq -r '.id' .zapierapprc)/version/$(git describe --tags)/monitoring"
  * länger unter beobachtung halten damit mal mehr requests hereinkommen, es kommt ein wenig auf die user an.
  * nach ca. 30 minuten canary 10% erneut iterieren
  * jeder schub durch eine iteration provoziert auch immer ein wenig traffic


## Nachbereiten

* [ ] in `develop` wechseln
* [ ] `develop` mit `main` aktualisieren
  * `git merge -m "merge release branch 'main' for v$(git describe --tags main)" "main"`
* [ ] packet version hochzählen und prüfen
  * `npm version --no-git-tag-version patch`
  * `npm list`
* [ ] change-log hochzählen
  * `sed -i '/^# Change-Log/a \\n## ['"$(npm list --json . | jq -r '.version')"'] - unreleased\n' "CHANGELOG.md"`
* [ ] prüfung der änderungen
  * `git diff`
* [ ] versionsnummern in package, lockfile und change-log sind korrekt
* [ ] neue `develop` version unter standard subject-line committen
  * `git commit -a -m "bump version $(npm list --json . | jq -r '.version') for development"`
* [ ] die subject-line des neuen commits ist korrekt
  * zeigt die neue version an
  * folgt dem standard wording
* [ ] arbeitszweige aktualisieren (falls vorhanden)
* [ ] in `main` wechseln
* [ ] version und `main` `upstream`en
  * `git push upstream "$(git describe --tags)" main:main`
