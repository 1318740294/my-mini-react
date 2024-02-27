import { updateAttributes } from './react-dom';
import { getDeletions } from './fiber';

//从根节点开始 commit
export function commitRoot(rootFiber){
    const deletions = getDeletions();
    deletions.forEach(commitWork);
    // console.log('rootFiber.child--',rootFiber.child);

    
    commitWork(rootFiber.child);

}

// 递归执行 commit，此过程不中断
function commitWork(fiber) {
    if(!fiber){
        return
    }
    // 获取父 dom  : commitRoot时获取的就是我们提供的根节点 document.getElementById('root')
    let parentDom = fiber.return.stateNode;
    // console.log('parentDom---',parentDom);
    if (fiber.flag === 'Deletion') {
        if (typeof fiber.element?.type !== 'function') {
            parentDom.removeChild(fiber.stateNode);
        }
        return;
    }
    commitWork(fiber.child);
    // 深度优先遍历，先遍历 child，后遍历 sibling
    if(fiber.flag === 'Placement'){
        //添加 dom
        const targetPositionDom = parentDom.childNodes[fiber.index]; //要插入到哪个 dom 之前
        if(targetPositionDom){
            //targetPositionDom存在，则插入
            parentDom.insertBefore(fiber.stateNode, targetPositionDom);
        }else{
            //targetPositionDom不存在，插入最后
            parentDom.appendChild(fiber.stateNode);
        }
    }else if(fiber.flag === 'Update'){
        const { children,...newAttributes } = fiber.element.props;
        const oldAttributes = Object.assign({},fiber.alternate.element.props);
        delete oldAttributes.children;
        updateAttributes(fiber.stateNode, newAttributes, oldAttributes);
    }
    commitWork(fiber.sibling);
}