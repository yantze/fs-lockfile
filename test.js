var mutexify = require('mutexify')
var lock = mutexify()
 
lock(function(release) {
  console.log('i am now locked')
  setTimeout(function() {
    release()
  }, 1000)
})
 
lock(function(release) {
  console.log('1 second later')
  release()
})
