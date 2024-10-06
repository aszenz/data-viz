const COMMON = `
.summary-container {
    display: flex;
    // overflow-x: auto;
    // overflow-y: auto;
  }
  
  .align-horizontal {
    flex-direction: row;
  }
  
  .align-vertical {
    flex-direction: column;
  }
  
  .summary-column {
    display: flex;
    text-align: center;
    align-items: center;
    justify-content: space-between;
    margin: 5px;
  }
  
  .align-header-top .summary-column,
  .align-header-bottom .summary-column {
    flex-direction: column;
  }
  
  .align-header-left .summary-column,
  .align-header-right .summary-column {
    flex-direction: row;
  }
  
  .summary-header {
    display: flex;
    justify-content: center;
    align-items: center;
  
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  
    font-size: 1.3vh;
  }
  
  .align-header-top .summary-header,
  .align-header-bottom .summary-header {
    flex-direction: column;
  }
  
  .align-header-left .summary-header,
  .align-header-right .summary-header {
    transform: rotate(-180deg);
    -webkit-transform: rotate(-180deg); /* Safari */
    -moz-transform: rotate(-180deg); /* Firefox */
    -ms-transform: rotate(-180deg); /* IE */
    -o-transform: rotate(-180deg); /* Opera */
    writing-mode: vertical-lr;
    text-overflow: ellipsis;
    display: inline-block;
    font-size: 0.8vh;
  
    // line-height: 3em; /* a */
    // height: 4em;
    // max-height: 4em; /* a x number of line to show (ex : 2 line)  */
  }
  
  .align-header-left .summary-header {
    border-left: 1px solid var(--inactive--color, #6e6e6e);
  }
  .align-header-right .summary-header {
    border-right: 1px solid var(--inactive--color, #6e6e6e);
  }
  
  .align-header-left .summary-header-divider,
  .align-header-right .summary-header-divider {
    display: none;
  }
  
  .summary-data {
    display: flex;
    flex-direction: column;
    align-items: center;
  
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  
    font-size: 3vh;
  }

`;
export const DEFAULT: string = `
${COMMON}

.summary-header-divider::after {
  content: "";
  display: block;
  margin: auto;
}

.align-header-top .summary-header-divider::after {
  border-bottom: 1px solid var(--inactive--color, #6e6e6e);
}

.align-header-left .summary-header-divider::after {
  border-right: 1px solid var(--inactive--color, #6e6e6e);
}

.align-header-right .summary-header-divider::after {
  border-left: 1px solid var(--inactive--color, #6e6e6e);
}

.align-header-bottom .summary-header-divider::after {
  border-top: 1px solid var(--inactive--color, #6e6e6e);
}

.align-header-top .summary-header-divider,
.align-header-bottom .summary-header-divider {
  width: 100%;
}

.align-horizontal.align-header-top .summary-header-divider::after,
.align-horizontal.align-header-bottom .summary-header-divider::after {
  height: 1px;
  width: 90%;
}

.align-vertical.align-header-top .summary-header-divider::after,
.align-vertical.align-header-bottom .summary-header-divider::after {
  height: 1px;
  width: 50%;
}

.align-horizontal.align-header-left .summary-header-divider::after,
.align-horizontal.align-header-right .summary-header-divider::after {
  height: 90%;
  width: 1px;
}

.align-vertical.align-header-left .summary-header-divider::after,
.align-vertical.align-header-right .summary-header-divider::after {
  height: 50%;
  width: 1px;
}
`;
export const MINIMAL: string = `
${COMMON}
.summary-header {
    display: none;
  }
  
  .summary-data {
    display: flex;
    flex-direction: column;
    align-items: center;
  
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  
    font-size: 4vh;
  }
`;
export const MODERN: string = `
${COMMON}
${DEFAULT}

/* common overrides */
.summary-column {
  text-align: left;
  align-items: center;
  justify-content: unset;
}

.align-header-left .summary-header,
.align-header-right .summary-header {
  transform: rotate(0deg);
  -webkit-transform: rotate(0deg); /* Safari */
  -moz-transform: rotate(0deg); /* Firefox */
  -ms-transform: rotate(0deg); /* IE */
  -o-transform: rotate(0deg); /* Opera */
  writing-mode: unset;
  font-size: 1vh;
}

/* default overrides */
.align-header-left .summary-header {
  margin-right: 5px;
  padding-right: 5px;
  border-right: 4px solid var(--inactive--color, #6e6e6e);
  border-left: 0px;
}
.align-header-right .summary-header {
  margin-left: 5px;
  padding-left: 5px;
  border-left: 4px solid var(--inactive--color, #6e6e6e);
  border-right: 0px;
}

.align-header-top .summary-header-divider::after {
  border-bottom: 4px solid var(--inactive--color, #6e6e6e);
}

.align-header-left .summary-header-divider::after {
  border-right: 4px solid var(--inactive--color, #6e6e6e);
}

.align-header-right .summary-header-divider::after {
  border-left: 4px solid var(--inactive--color, #6e6e6e);
}

.align-header-bottom .summary-header-divider::after {
  border-top: 4px solid var(--inactive--color, #6e6e6e);
}

.align-horizontal.align-header-top .summary-header-divider::after,
.align-horizontal.align-header-bottom .summary-header-divider::after {
  height: 4px;
}

.align-vertical.align-header-top .summary-header-divider::after,
.align-vertical.align-header-bottom .summary-header-divider::after {
  height: 4px;
}

.align-horizontal.align-header-left .summary-header-divider::after,
.align-horizontal.align-header-right .summary-header-divider::after {
  width: 4px;
}

.align-vertical.align-header-left .summary-header-divider::after,
.align-vertical.align-header-right .summary-header-divider::after {
  width: 4px;
}`;
