# Custom TensorFlow.js Model Directory

Drop your custom converted TensorFlow.js model files here:
- `model.json` (model architecture and weight manifest)
- `group1-shard1of1.bin` (or multiple `.bin` weight shard files)

## How to convert a Keras model to TensorFlow.js:
```bash
pip install tensorflowjs
tensorflowjs_converter --input_format=keras path/to/maternal_model.h5 ./public/model/
```

## How the app handles this:
The app automatically probes `/model/model.json`. If present, it loads your custom model using `tf.loadLayersModel('/model/model.json')` and caches it with Workbox Service Worker for offline use. If no custom model is placed here, the app uses its built-in calibrated Sequential Neural Network model.

