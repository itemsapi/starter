# ItemsAPI starter

This starter let you generate search application quickly!

## Heroku installation

Deploy ItemsAPI starter instantly to heroku and start your app (backend creator) immediately!

<a target="_blank" href="https://heroku.com/deploy?template=https://github.com/itemsapi/itemsapi-starter"><img src="https://camo.githubusercontent.com/c0824806f5221ebb7d25e559568582dd39dd1170/68747470733a2f2f7777772e6865726f6b7563646e2e636f6d2f6465706c6f792f627574746f6e2e706e67" alt="Deploy" data-canonical-src="https://www.herokucdn.com/deploy/button.png"></a>


## Manual installation

- Install elasticsearch on your computer
- `git clone git@github.com:itemsapi/starter.git`
- `cd starter`
- `npm install`
- `PORT=3000 npm start`

Open localhost:3000 and follow instruction in web creator

## Manual installation

Run itemsapi starter: 
- `docker run --rm -p 3000:3000 --name=starter -e="ELASTICSEARCH_URL=http://172.17.0.2:9200" -it itemsapi/starter`
(You need to provide elasticsearch url to make it working)

## Features 

- auto-generated filters
- search
- basic layout
- items recommendation
- item details
- sitemap

## Todo

- reviews system
- views counter
- simple administration panel for data management
