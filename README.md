[![Website](https://img.shields.io/website-up-down-green-red/https/shorturlms.herokuapp.com%2F.svg?maxAge=2592000)](https://shorturlms.herokuapp.com/)
[![StackShare](http://img.shields.io/badge/tech-stack-0690fa.svg?style=flat)](http://stackshare.io/DavOnGit/myown)
[![License](https://img.shields.io/cocoapods/l/AFNetworking.svg)](http://doge.mit-license.org)

# Url Shortener Microservice

### In this App:

- I can pass a URL as a parameter and I will receive a shortened URL in the JSON response.
- When I visit that shortened URL, it will redirect to original link.

### Example:

Point your browser to one of the following addresses:

[https://shorturlms.herokuapp.com/cut/http://www.jpl.nasa.gov/spaceimages](https://shorturlms.herokuapp.com/cut/http://www.jpl.nasa.gov/spaceimages)  
or:  
[https://shorturlms.herokuapp.com/cut/http://89.208.1.1](https://shorturlms.herokuapp.com/cut/http://89.208.1.1/)

### Example output:

```
{
    "original_url":"http://www.jpl.nasa.gov/spaceimages/",
    "short_url":"https://shorturlms.herokuapp.com/sVPGhZ"
}
```

---

## Running Locally

Make sure you have [Node.js](http://nodejs.org/) installed.

```sh
$ git clone https://github.com/DavOnGit/short-url-ms.git # or clone your own fork
$ cd short-url-ms
$ npm install
$ npm start
```

Your app now should be running on [localhost:5000](http://localhost:5000/).

## Deploying to Heroku

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

or

Make sure you have the [Heroku Toolbelt](https://toolbelt.heroku.com/) installed.

```
$ heroku create
$ git push heroku master
$ heroku open
```