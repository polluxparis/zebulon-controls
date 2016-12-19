import { connect } from 'react-redux';
import { getRowFields, getColumnFields, getAvailableFields } from 'zebulon-grid/lib/commonjs/selectors';
import GridConfiguration from '../components/GridConfiguration';
import { moveField, toggleDatafield } from 'zebulon-grid/lib/commonjs/actions';

const mapStateToProps = state => ({
  datafields: state.datafields,
  rowFields: getRowFields(state),
  columnFields: getColumnFields(state),
  availableFields: getAvailableFields(state),
});

const mapDispatchToProps = dispatch => ({
  moveField: (fieldId, oldAxis, newAxis, position) => {
    dispatch(moveField(fieldId, oldAxis, newAxis, position));
  },
  toggleDatafield: (fieldId) => {
    dispatch(toggleDatafield(fieldId));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(GridConfiguration);
