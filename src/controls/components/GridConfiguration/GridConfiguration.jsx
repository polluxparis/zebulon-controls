import React, { Component } from 'react';

import FieldButton from '../../containers/FieldButton';
import DataButton from '../DataButton';
import FieldList from '../FieldList';

class GridConfiguration extends Component {
  constructor(props) {
    super(props);
    this.moveButton = this.moveButton.bind(this);
  }

  moveButton(buttonId, oldAxis, newAxis, position) {
    this.props.moveField(buttonId, oldAxis, newAxis, position);
  }

  render() {
    const { availableFields, datafields, rowFields, columnFields } = this.props;
    const dropTargetContainerStyle = { display: 'flex', alignItems: 'center' };

    // if (canMoveFields) {
    const fieldsButtons = availableFields.map((field, index) =>
      <FieldButton
        key={field.id}
        field={field}
        axis={'fields'}
        position={index}
      />);
    const unusedFieldList = (
      <div style={dropTargetContainerStyle}>
        <div style={{ padding: '7px 4px' }}>
          Fields
        </div>
        <div style={{ padding: '7px 4px' }}>
          <FieldList
            buttons={fieldsButtons}
            axis={'fields'}
            moveButton={this.moveButton}
          />
        </div>
      </div>
    );
    // } else {
    //   unusedFieldList = null;
    // }

    const dataButtons = Object.values(datafields)
      .map((field, index) =>
        <div style={{ padding: '0px 4px' }} key={`data-button-${field.id}`}>
          <DataButton
            key={field.id}
            field={field}
            position={index}
            active={field.activated}
            handleClick={this.props.toggleDatafield}
          />
        </div>);

    const dataButtonsContainer = (
      <div style={dropTargetContainerStyle}>
        <div style={{ padding: '7px 4px' }}>
          <div>
            Data
          </div>
        </div>
        <div style={{ padding: '7px 4px' }}>
          <div style={{ display: 'flex' }}>
            {dataButtons}
          </div>
        </div>
      </div>
    );

    const columnButtons = columnFields.map((field, index) =>
      <FieldButton
        key={field.id}
        field={field}
        axis={'columns'}
        position={index}
      />);

    const columnFieldList = (
      <div style={dropTargetContainerStyle}>
        <div style={{ padding: '7px 4px' }}>
          Columns
        </div>
        <div style={{ padding: '7px 4px' }}>
          <FieldList
            buttons={columnButtons}
            axis={'columns'}
            moveButton={this.moveButton}
          />
        </div>
      </div>
    );

    const rowButtons = rowFields.map((field, index) =>
      <FieldButton
        key={field.id}
        field={field}
        axis={'rows'}
        position={index}
      />);

    const rowFieldList = (
      <div style={dropTargetContainerStyle}>
        <div style={{ padding: '7px 4px' }}>
          Rows
        </div>
        <div style={{ padding: '7px 4px' }}>
          <FieldList
            buttons={rowButtons}
            axis={'rows'}
            moveButton={this.moveButton}
          />
        </div>
      </div>
    );

    const style = {
      borderSpacing: 0,
      borderCollapse: 'separate',
    };
    return (
      <div style={style}>
        <div>
          {unusedFieldList}
          {columnFieldList}
          {rowFieldList}
        </div>
        {dataButtonsContainer}
      </div>
    );
  }
}

export default GridConfiguration;
