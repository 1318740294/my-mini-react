import { deleteFiber } from "./fiber";

export function reconcileChildren(workInProgress,elements){
    let index = 0; // 当前遍历的子元素在父节点下的下标
    let prevSibling = null; // 记录上一个兄弟节点

    let oldFiber = workInProgress?.alternate?.child; //对应旧的fiber

    while(index < elements.length || oldFiber){
        //遍历elements 和 oldFiber
        const element = elements[index]
        //创建新的 fiber
        let newFiber = null;
        const isSameType = 
            element?.type &&
            oldFiber?.element?.type &&
            element?.type === oldFiber?.element?.type;
        //添加副作用标签
        if(isSameType){ 
          //type相同，表示更新
          newFiber = {
              element: {
                ...element,
                props: element.props
              },
              stateNode: oldFiber.stateNode,
              return : workInProgress,
              alternate: oldFiber,
              flag: 'Update'
          }
        }else{
          //type不同，表示添加或者删除
          if(element||element ===0){
            newFiber = {
                element,
                stateNode: null,
                return: workInProgress,
                alternate:null,
                flag: 'Placement',
                index
            }
          }
          if(oldFiber){
            //oldFiber存在，删除oldFiber
            oldFiber.flag = 'Deletion';
            deleteFiber(oldFiber)
          }
        }
        if(oldFiber){
            //oldFiber存在，则继续遍历其 sibling
            oldFiber = oldFiber.sibling;
        }

        if(index === 0){
            //如果下标为 0，则将当前fiber设置为父 fiber 的 child
            workInProgress.child = newFiber;
            prevSibling = newFiber;
        }else if(newFiber){
            prevSibling.sibling = newFiber;
            prevSibling = newFiber;
        }
        index ++
    }
}