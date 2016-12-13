import React from 'react';
import { DropTarget } from 'react-dnd';

import DropIndicator from './DropIndicator';

const FieldList = ({ buttons, axis, connectDropTarget, isOverCurrent, isOver, moveButton }) => {
  const buttonComponents = buttons.map((button, index) => {
    if (index < buttons.length - 1) {
      return [
        <div>
          <DropIndicator
            isFirst={index === 0}
            position={index}
            axis={axis}
            moveButton={moveButton}
          />
        </div>,
        <div>
          {button}
        </div>];
    }
    return [
      <div>
        <DropIndicator
          isFirst={index === 0}
          position={index}
          axis={axis}
          moveButton={moveButton}
        />
      </div>,
      <div>
        {button}
      </div>,
      <div>
        <DropIndicator
          isLast
          position={index + 1}
          axis={axis}
          moveButton={moveButton}
        />
      </div>];
  });

  const highlight = buttons.length === 0 ? isOver : isOver && !isOverCurrent;

  const style = {
    border: highlight ? 'dotted rgba(255, 192, 222, 0.7)' : 'dotted rgba(91, 192, 222, 0.7)',
    minHeight: '24px',
    minWidth: '67px',
    borderRadius: 10,
    display: 'flex',
  };

  return connectDropTarget(
    <div style={style}>
      {buttonComponents}
    </div>);
};

const dropTarget = {
  drop(props, monitor) {
    const { id, axis } = monitor.getItem();
    props.moveButton(id, axis, props.axis, props.position);
  },
  canDrop(props) {
    return props.buttons.length === 0;
  },
};

const collect = (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
  isOverCurrent: monitor.isOver({ shallow: true }),
});

export default DropTarget('button', dropTarget, collect)(FieldList);
