# Server monitor

## CREATE APP CONFIG FILES

```
cp app/.env.dist app/.env
```

## BUILD APPLICATION

- in dev mode

```
docker-compose up -d --build
docker exec -ti server-monitor-nodejs bash -c 'npm install'
docker exec -ti server-monitor-nodejs bash -c 'npm start'
```

- in prod mode

```
docker-compose up -d --build
docker exec -ti server-monitor-nodejs bash -c 'npm install'
docker exec -ti server-monitor-nodejs bash -c 'npm run start:prod'
```
