import { createRoot } from "./fiber";

function render(element, container) {
    // const dom = renderDom(element);
    // container.appendChild(dom);
    createRoot(element,container)
  }
//16.x 版本及之前,通过 @babel/preset-react 将jsx转换为React.createElement 的 js 代码，因此需要显式将 React 引入,再由React.createElement生成React.Element;
//17.x 版本及之后,将jsx转换为React.Element的步骤在react/jsx-runtime（babel）完成了

// 将 React.Element 渲染为真实 dom
export function renderDom(element) {
    // console.log('element----',element);
    let dom = null; // 要返回的 dom
  
    if (!element && element !== 0) {
      // 条件渲染为假，返回 null
      return null;
    }
  
    if (typeof element === 'string') {
      // 如果 element 本身为 string，返回文本节点
      dom = document.createTextNode(element);
      return dom;
    }
  
    if (typeof element === 'number') {
      // 如果 element 本身为 number，将其转为 string 后返回文本节点
      dom = document.createTextNode(String(element));
      return dom;
    }
    const {
      type,
      props: { children,...attributes },
    } = element;
  
    if (typeof type === 'string') {
      // 常规 dom 节点的渲染
      dom = document.createElement(type);
    } else if (typeof type === 'function') {
      // React组件的渲染
      dom = document.createDocumentFragment()
    } else {
      // 其他情况暂不考虑
      return null;
    }
  
    updateAttributes(dom,attributes)
    return dom;
}
  
//添加元素属性
export function updateAttributes(dom,attributes,oldAttributes){
    if(oldAttributes){
        //有旧属性，移除旧属性
        Object.keys(oldAttributes).forEach((key) => {
            if(key.startsWith('on')){
                //移除旧事件
                const evevtName = key.slice(2).toLowerCase();
                dom.removeEventListener(evevtName,oldAttributes[key]);
            }else if(key === 'className'){
                // className 的处理 
                const classes = attributes[key].split(' ');
                classes.forEach((cls) => {
                    dom.classList.remove(cls);
                })
            }else if(key === 'style'){
                // style处理
                const styles = attributes[key];
                Object.keys(styles).forEach((styleName) => {
                  dom.style[styleName] = 'initial';
                })
            }else{
                // 其他属性的处理
                dom[key] ='';
            }
        })
    }
    Object.keys(attributes).forEach((key) => {
        if(key.startsWith('on')){
            //事件的处理
            const evevtName = key.slice(2).toLowerCase();
            dom.addEventListener(evevtName,attributes[key]);
        }else if(key === 'className'){
            // className 的处理 
            const classes = attributes[key].split(' ');
            classes.forEach((cls) => {
                dom.classList.add(cls);
            })
        }else if(key === 'style'){
            // style处理
            const styles = attributes[key];
            Object.keys(styles).forEach((styleName) => {
              dom.style[styleName] = styles[styleName];
            })
        }else{
            // 其他属性的处理
            dom[key] = attributes[key];
        }
    })
}

const ReactDOM = {
    render,
};
export default ReactDOM;