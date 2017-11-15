import React, { Component } from 'react';
// import ContentEditable from 'react-simple-contenteditable';
import ReactMarkdown from 'react-markdown'
import Textfit from 'react-textfit';



class TextLayout extends Component {
  constructor (props) {
    super(props);

    this.state = {
      text: this.props.content,
    }

  }


  render(){
    return (
      <div className='text' >
        <Textfit className={"fit"} mode="multi">
          <ReactMarkdown style={{width: '100%'}} className={this.state.fontSize} source={this.props.content} />
        </Textfit>
      </div>
      );
    }
}

export default TextLayout
