---
title: 关于一次线上出错的思考--如何规避线上程序崩盘
date: 2018-06-11 10:22:32
categories:
- 心得实践
tags:
- JavaScript
- React
---

> 近日在工作中由于疏忽问题导致某个客户的系统直接崩盘，极大的影响了用户使用产品的体验。在经过修改之后，不得不思考下在日常开发中的一些坏习惯以及如何规避这些日常问题了。

<!-- more -->
在日常开发中，我们往往会有很多不好的习惯，写出一些非常不健壮的代码，导致由于数据和条件的多样性，程序未能作出很好的预判。同时由于我们未能对错误进行好的处理，导致程序直接卡死。虽然这些问题可能是非常“低级”的错误，但也是非常常见的错误，所以有必要拿出来说一说。

## 1.为键值匹配设定默认值
针对以下这种键值匹配，我们往往并不能对所有的可能进行枚举，建议对其设置通用的默认值，也避免了在业务逻辑中进行重复的处理。避免为匹配到正确的值而报错。

``` js
const map = (obj, defaultValue) => {
  return new Proxy(obj, {
    get (target, key) {
      // 你可以在这里进行其他处理
      return Reflect.get(target, key, receiver) || defaultValue
    }
  })
}
const typeValueMap = map({
  a: {
    color: 'red',
    desc: '红色'
  },
  b: {
    color: 'blue',
    desc: '蓝色'
  }
}, {
  color: 'ccc',
  desc: '灰色'
})

const result = typeValueMap[type]
```

## 2.当css-modules不能正确匹配时，不直接throw
css-modules会针对未能匹配的样式名，直接抛出问题，使整个模块崩掉。在生产环境中，个人觉得这种做法可能过于激进了，当然官方也提供了handleNotFoundStyleName参数，用于设置未匹配时，是直接throw, warn还是忽略。在此我们可以进行统一的处理：

``` js
import cssmodules from 'react-css-modules'

export default (style, allowMutiple = false) => cssmodules(style, {
  allowMultiple,
  handleNotFoundStyleName: 'log'
})
```

## 3.对未知的事件进行try/catch
程序的执行过程中，我们往往无法保证传入的数据是我们想要的，因此我们需要对一些不能保证的过程进行try/catch，防止程序卡死。这也是很基础的一个内容了，但是保持良好的代码风格还是很重要的！

``` js
let ret
try {
  ret = JSON.parse(json)
} catch (error) {
  // 错误处理，错误上报
}
```

## 4.使用ErrorBoundary对错误进行友好提示，保证其他模块的可用性
类似try/catch，在react 16中也提供了对组件内部异常进行捕获的机制。我们可以利用这个机制，对错误进行友好的提示，避免整个程序卡死，保证其他模块是可用的，同时可以进行错误上报等操作。

``` js
export default class ErrorBoundary extends Component {
  state = {
    error: false
  }

  componentDidCatch(error, info) {
    const { onError = report, children, ...others } = this.props
    this.setState({
      error: {
        error,
        info,
        prop: others
      }
    })
    onError(error, info, others)
  }

  render() {
    const { error } = this.state

    if (error) {
      return <ErrorBlock error={error} />
    }
    return this.props.children
  }
}
```

## 5.及时进行错误回传，监控平台的稳定性
通过配合类似[sentry](https://github.com/getsentry/sentry)这样的平台错误上报与收集，可以很方便的拿到用户的错误信息，错误时的props等数据，方便定位问题，拿到重要的反馈信息。

## 6.总结
总的来说，很多情况下错误的诞生还是由于我们代码的“不健壮”导致的，所以在使用其他方案进行规避的同时，如何提升代码质量，保证代码稳定运行，是我们需要不断追求与提升的。