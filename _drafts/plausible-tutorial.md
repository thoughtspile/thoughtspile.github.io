---
title: Up and running with plausible
---

With that in place, we can set up our plausible instance. I'll make it quick, since there already is a [tutorial by mr. Mansoor,](https://esc.sh/blog/plausible-analytics-selfhosting/) and the docs do a decent job:

1. [Install docker.](https://docs.docker.com/engine/install/ubuntu/)
2. Start plausible: clone the repo, edit config, and `docker-compose up -d` the service (see [docs](https://plausible.io/docs/self-hosting)). If this worked, you can access the UI at `http://your.ip.1.1:8000`
3. You can't send analytics from your HTTPS website to an HTTP endpoint, so there's more work.
4. Go to your DNS settings, come up with an analytics subdoiain (like `an.you.io`) and add server IP to the relevant A/AAAA record. Plausible _can not_ live on a `/path`, it needs its own subdomain. Success = the UI is live on `http://an.you.io:8000`
5. Now we need a reverse proxy for SSL termination. I went for a full-dockerized setup with [nginx-proxy](https://github.com/nginx-proxy/nginx-proxy) container. Set `VIRTUAL_HOST` in `plausible-conf` to enable discovery, append `nginx-proxy` to `docker-compose.yml`, restart, and you should be able to access analytics at `http://an.you.io`. Un-exposing the port 8000 at this point won't hurt either.
7. Now, the actual SSL certificates.  подключаем волшебный контейнер с letsencrypt (авто-выписываемые SSL сертификаты) — https://github.com/nginx-proxy/acme-companion 
8. Finally https://an.you.io/js/script.js и смотреть как трафик полился
9. Самая болезненная часть — выгрузить данные аналитики из гугла. Шаг можно скипнуть, но моя цель — забрать у гугла все что можно из принципа. Час плясок с Google Cloud и SSO, инструкция норм: https://plausible.io/docs/google-analytics-import
