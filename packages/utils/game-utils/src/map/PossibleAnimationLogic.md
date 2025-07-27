
want to animate the path???
```
var getPixels = require('get-pixels')
var GifEncoder = require('gif-encoder');
var gif = new GifEncoder(1280, 720);
var file = require('fs').createWriteStream('img.gif');
var pics = ['./pics/1.jpg', './pics/2.jpg', './pics/3.jpg'];

gif.pipe(file);
gif.setQuality(20);
gif.setDelay(1000);
gif.writeHeader();

var addToGif = function(images, counter = 0) {
  getPixels(images[counter], function(err, pixels) {
    gif.addFrame(pixels.data);
    gif.read();
    if (counter === images.length - 1) {
      gif.finish();
    } else {
      addToGif(images, ++counter);
    }
  })
}
addToGif(pics);
```