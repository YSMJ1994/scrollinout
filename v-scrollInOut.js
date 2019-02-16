// 默认dom体积系数
let defaultThreshold = [0.2, 1]

/**
 * 防抖节流
 * @param {*} action 回调
 * @param {*} delay 等待的时间
 * @param {*} context this指针
 * @param {Boolean} iselapsed 是否等待上一次
 * @returns {Function}
 */
export function throttle(action, delay, context, iselapsed) {
    let timeout = null
    let lastRun = 0
    return function() {
        if (timeout) {
            if (iselapsed) {
                return
            } else {
                clearTimeout(timeout)
                timeout = null
            }
        }
        let elapsed = Date.now() - lastRun
        let args = arguments
        if (iselapsed && elapsed >= delay) {
            runCallback()
        } else {
            timeout = setTimeout(runCallback, delay)
        }
        /**
         * 执行回调
         */
        function runCallback() {
            lastRun = Date.now()
            timeout = false
            action.apply(context, args)
        }
    }
}

const getFirstOverflowRoot = el => {
    if (el.tagName === "html") {
        return null
    }
    let parent = el.parentElement
    if (!parent) {
        return null
    }
    let computedStyle = window.getComputedStyle(parent, null)
    if (
        computedStyle.overflow === "auto" ||
        computedStyle.overflowX === "auto" ||
        computedStyle.overflowY === "auto"
    ) {
        return parent
    } else {
        return getFirstOverflowRoot(parent)
    }
}

const computedThreshold = arg => {
    let threshold
    let args = (arg || "").match(/\d+%/g) || []
    let firstThreshold = args[0]
    let secondThreshold = args[1]
    if (firstThreshold) {
        firstThreshold = parseFloat(firstThreshold)
        if (!isNaN(firstThreshold)) {
            firstThreshold = firstThreshold / 100
        }
    }
    if (secondThreshold) {
        secondThreshold = parseFloat(secondThreshold)
        if (!isNaN(secondThreshold)) {
            secondThreshold = secondThreshold / 100
        }
    }
    if (args.length >= 2) {
        threshold = [firstThreshold, secondThreshold]
    } else if (args.length === 1) {
        if (firstThreshold === 0) {
            threshold = 0
        } else {
            threshold = [firstThreshold / 2, 1 - firstThreshold / 2]
        }
    } else {
        threshold = defaultThreshold
    }
    return threshold
}

const getElementMargin = el => {
    if (!el) {
        return "0px 0px 0px 0px"
    }
    let computedStyle = window.getComputedStyle(el, null)
    return `${computedStyle.marginTop} ${computedStyle.marginRight} ${
        computedStyle.marginBottom
    } ${computedStyle.marginLeft}`
}

const computedIsIn = function(threshold, el, root) {
    const { width, height, offsetLeft, offsetTop } = el
    const {
        width: parentWidth,
        height: parentHeight,
        scrollTop,
        scrollLeft
    } = root
    let extraX = 0,
        extraY = 0
    if (threshold === 0) {
        extraX = 0
        extraY = 0
    } else if (threshold === 1) {
        extraX = width
        extraY = height
    } else {
        let [firstRatio, secondRatio] = threshold || []
        let extraX1 = 0,
            extraX2 = 0,
            extraY1 = 0,
            extraY2 = 0
        if (typeof firstRatio !== "undefined") {
            extraX1 = width * firstRatio
            extraY1 = height * firstRatio
        }
        if (typeof secondRatio !== "undefined") {
            extraX2 = width * secondRatio
            extraY2 = height * secondRatio
        }
        return (
            offsetTop + extraY2 >= scrollTop &&
            offsetTop + extraY1 <= scrollTop + parentHeight &&
            offsetLeft + extraX2 >= scrollLeft &&
            offsetLeft + extraX1 <= scrollLeft + parentWidth
        )
    }
    return (
        offsetTop + height - extraY >= scrollTop &&
        offsetTop + extraY <= scrollTop + parentHeight &&
        offsetLeft + width - extraX >= scrollLeft &&
        offsetLeft + extraX <= scrollLeft + parentWidth
    )
}

const scrollin = {
    bind(el, binding, vnode) {
        if (binding.expression && !(binding.value instanceof Function)) {
            console.error(
                `[directive error]: v-scrollin directive do not support expression '${
                    binding.expression
                }'! please set it with a function`
            )
            return
        }

        function executeCallback(flag) {
            if (binding.expression && binding.value instanceof Function) {
                binding.value.bind(vnode.context)(flag)
            }
        }

        let threshold = computedThreshold(binding.arg)
        if (
            "IntersectionObserver" in window &&
            "IntersectionObserverEntry" in window &&
            "intersectionRatio" in window.IntersectionObserverEntry.prototype
        ) {
            el.observerSupport = true
            if (el.observer) {
                el.observer.disconnect()
            }
            vnode.context.$nextTick(() => {
                let root = getFirstOverflowRoot(el)
                console.log("root", root)
                let margin = getElementMargin(root)
                el.observer = new IntersectionObserver(
                    entries => {
                        if (entries[0].isIntersecting) {
                            // 进入可视区域
                            if (!el.__scrollIn__) {
                                el.__scrollIn__ = true
                                executeCallback(true)
                            }
                        } else {
                            // 移出可视区域
                            if (
                                el.__scrollIn__ ||
                                typeof el.__scrollIn__ === "undefined"
                            ) {
                                el.__scrollIn__ = false
                                executeCallback(false)
                            }
                        }
                    },
                    {
                        root: root,
                        rootMargin: margin,
                        threshold: threshold
                    }
                )
                el.observer.observe(el)
            })
        } else {
            // 手动实现
            vnode.context.$nextTick(() => {
                let root = getFirstOverflowRoot(el)
                function scrollEventHandler(e) {
                    let scrollTop, scrollLeft, parentWidth, parentHeight
                    if (root) {
                        scrollTop = e.target.scrollTop
                        scrollLeft = e.target.scrollLeft
                        let rect = e.target.getBoundingClientRect()
                        parentWidth = rect.width
                        parentHeight = rect.height
                    } else {
                        scrollTop = window.scrollX
                        scrollLeft = window.scrollY
                        parentWidth = window.innerWidth
                        parentHeight = window.innerHeight
                    }
                    let { offsetTop, offsetLeft } = el
                    let { width, height } = el.getBoundingClientRect()
                    if (
                        computedIsIn(
                            threshold,
                            { width, height, offsetLeft, offsetTop },
                            {
                                width: parentWidth,
                                height: parentHeight,
                                scrollLeft,
                                scrollTop
                            }
                        )
                    ) {
                        // scroll x & y in
                        if (!el.__scrollIn__) {
                            el.__scrollIn__ = true
                            executeCallback(true)
                        }
                    } else {
                        // scroll x & y out
                        if (
                            el.__scrollIn__ ||
                            typeof el.__scrollIn__ === "undefined"
                        ) {
                            el.__scrollIn__ = false
                            executeCallback(false)
                        }
                    }
                }

                // 节流
                let throttleHandler = throttle(
                    scrollEventHandler,
                    100,
                    undefined,
                    true
                )
                el.__vueScrollInOut_handler__ = throttleHandler
                el.__vueScrollInOut_root__ = root
                const eventRoot = root || window
                eventRoot.addEventListener("scroll", throttleHandler)
                // 初始化判断
                let myEvent = new Event("scroll")
                eventRoot.dispatchEvent(myEvent)
                throttleHandler = null
            })
        }
    },
    unbind(el, binding) {
        // 销毁
        if (el.observerSupport) {
            el.observer.disconnect()
            Reflect.deleteProperty(el, "observer")
        } else {
            if (el.__vueScrollInOut_root__) {
                el.__vueScrollInOut_root__.removeEventListener(
                    "scroll",
                    el.__vueScrollInOut_handler__
                )
            } else {
                window.removeEventListener(
                    "scroll",
                    el.__vueScrollInOut_handler__
                )
            }
            Reflect.deleteProperty(el, "__vueScrollInOut_root__")
            Reflect.deleteProperty(el, "__vueScrollInOut_handler__")
        }
        Reflect.deleteProperty(el, "__scrollIn__")
    }
}
export default {
    install(Vue) {
        Vue.directive("scrollInOut", scrollin)
    }
}
