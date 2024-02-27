import { renderDom } from "./react-dom";
import { commitRoot } from './commit';
import { reconcileChildren } from "./reconciler";
//下一工作单元
let nextUnitOfWork = null;
let workInProgressRoot = null; // 当前工作的 fiber 树
let currentRoot = null; // 上一次渲染的 fiber 树
let deletions = []; // 用来保存要执行删除dom 的 fiber 
let currentFunctionFiber = null; // 当前正在执行的函数组件对应 fiber
let hookIndex = 0; //  当前正在执行的函数组件 hook 的下标

// 获取当前的执行的函数组件对应的 fiber
export function getCurrentFunctionFiber() {
    return currentFunctionFiber;
}

export function getHookIndex() {
    return hookIndex++;
}

export function deleteFiber(fiber){
    deletions.push(fiber);
}

export function getDeletions(){
    return deletions;
}

//触发渲染
export function commitRender() {
    workInProgressRoot = {
        stateNode: currentRoot.stateNode,
        element: currentRoot.element,
        alternate: currentRoot
    }
    nextUnitOfWork = workInProgressRoot;
}


function updateClassComponent(fiber){
    let jsx
    if(fiber.alternate){
        //有旧组件，复用
        const component = fiber.alternate.component;
        fiber.component = component;
        component._UpdateProps(fiber.element.props)
        jsx = component.render()
    }else{
         //没有则创建新组件
         const {props,type:Comp} = fiber.element;
         const component = new Comp(props);
         fiber.component = component;
         jsx = component.render();
    }
    reconcileChildren(fiber,[jsx]);
}

function updateFunctionComponent(fiber){
    currentFunctionFiber = fiber;
    currentFunctionFiber.hooks = [];
    hookIndex = 0;
    const {props,type:Fn } = fiber.element;
    const jsx = Fn(props);
    reconcileChildren(fiber,[jsx]);
}

// 创建 workInProgressRoot 作为首个 nextUnitOfWork
export function createRoot(element,container) {
    workInProgressRoot = {
        stateNode : container, //记录对应的真实 dom 节点
        element: {
            props : {children:[element]},
        },
        alternate: currentRoot
    }
    nextUnitOfWork = workInProgressRoot;
}

    function performUnitOfWork(workInProgress){
        if(!workInProgress.stateNode){
            //若当前的 fiber 没有
            workInProgress.stateNode =  renderDom(workInProgress.element)
        }
        let children = workInProgress.element?.props?.children;
        let type = workInProgress.element?.type;
        if(typeof type === 'function'){
            // 当前 fiber 对应 React 组件时，对其 return 迭代
            if(type.prototype.isReactComponent){
                //类组件
                // const { props, type:Comp } = workInProgress.element;
                // const component = new Comp(props);
                // const jsx = component.render();
                // //这里函数返回的已经是一个 react.element 了
                // // console.log('component---jsx',jsx);
                // children = [jsx]

                updateClassComponent(workInProgress)
            }else{
                //函数组件
                // const { props, type:Fn } = workInProgress.element;
                // const jsx = Fn(props);
                // //这里函数返回的已经是一个 react.element 了
                // // console.log('Fn---jsx',jsx);
                // children = [jsx]
                updateFunctionComponent(workInProgress)
            }
        }

    if(children || children === 0){
        // children 存在时，对 children 迭代
        let elements = Array.isArray(children) ? children : [children];
        // 打平列表渲染时二维数组的情况（暂不考虑三维及以上数组的情形）
        elements = elements.flat();
        reconcileChildren(workInProgress, elements);
    }

    //设置下一个工作单元
    if(workInProgress.child){
        //如果有子 fiber,则下一个工作单元是子 fiber
        nextUnitOfWork = workInProgress.child;
    }else{
        let nextFiber = workInProgress;
        while(nextFiber){
            if(nextFiber.sibling){
                //如果子 fiber 有兄弟 fiber,则下一个工作单元是兄弟 fiber
                nextUnitOfWork = nextFiber.sibling;
                return;
            }else{
                //子 fiber和兄弟fiber都没有,深度优先遍历返回上一层
                nextFiber = nextFiber.return;
            }
        }
        if(!nextFiber){
            //若返回最顶层，表示迭代结束，将 nextUnitOfWork 置空
            nextUnitOfWork = null;
        }
    }
}

//处理循环和中断逻辑
function workLoop(deadline){
    let shouldYield = false;
    while(nextUnitOfWork && !shouldYield){
        //循环执行工作单元任务
        // console.log('nextUnitOfWork---',nextUnitOfWork);
        performUnitOfWork(nextUnitOfWork);
        shouldYield = deadline.timeRemaining() < 1;
    }
    if(!nextUnitOfWork && workInProgressRoot){
        //表示进入commit 阶段
        commitRoot(workInProgressRoot);
        currentRoot = workInProgressRoot
        workInProgressRoot = null;
        deletions = []
    }
    requestIdleCallback(workLoop);
}


requestIdleCallback(workLoop);