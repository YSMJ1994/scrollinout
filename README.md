# scrollinout [![npm](https://img.shields.io/npm/v/scrollinout.svg)](https://www.npmjs.com/package/scrollinout) [![npm](https://img.shields.io/npm/dm/scrollinout.svg)](https://www.npmjs.com/package/scrollinout) [![npm](https://img.shields.io/npm/l/scrollinout.svg)](LICENSE)

## Installation

```bash
npm i scrollinout -S
```

## Usage

Vue directive

### install

```js
import scrollInOut from 'scrollinout'
import Vue from 'vue'

Vue.use(scrollInOut)
```

### use in .vue

```html
<template>
    <!-- 参数为dom实体的判定面积(默认[20%,100%])，如下面 [0%,100%] 代表dom面积为整个dom的高宽，
    面积只要有一点出现在视野范围内或离开视野范围则调用传入的函数，目前只支持传入函数。 -->
    <!-- 绑定节点需要有固定宽高，如果自适应内容高度，如下的写法则会缺少占位空间 -->
    <div style="height: 30px" v-scroll-in-out:[0%,100%]="stateChange">
        <span v-if="show">{{message}}</span>
    </div>
</template>

<script>
    export default {
        data() {
            return {
                show: false,
                message: 'message'
            }
        },
        methods: {
            stateChange(isIn) {
                if(isIn) {
                    // component scroll in view
                    this.show = true
                } else {
                    // component scroll out of view
                    this.show = false
                }
            }
        }
    }
</script>
```

## License

MIT. Copyright (c) [SoberZ](https://www.soberz.cn).