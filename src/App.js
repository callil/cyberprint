import React, { Component } from 'react';
import config from './config'
import ImageLayout from './components/ImageLayout'
import TextLayout from './components/TextLayout'
import LinkLayout from './components/LinkLayout'
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      url: 'https://www.are.na/melanie-hoff/cybernetics-conference-map',
      channel: !this.props.URICurrentChannel ? 'killer-quotes' : this.props.URICurrentChannel,
      output: [
        {
          text: 'loading next dyptich... ',
          type: 'command'
        }
      ],
      printed: [],
      collected: [],
      response: [],
      print: false,
      currentPage: [
        {
          left: '',
          right: ''
        }
      ],
      printed:0,
      currentChannels: {},
    }
  }

  componentDidMount = () => {
    this.getArenaChannel(this.state.channel)
    setInterval(this.interval, 30000)
  }

  interval = () => {
    this.getArenaChannel(this.state.channel)
    this.state.print ? setTimeout(window.print() , 1000) : console.log('not printing right now...')
  }

  addScrape = (item, type) =>{
    let newScrape = this.state.output
    newScrape.unshift({content: item, type: type})
    this.setState({output: newScrape})
  }

  createDip = () => {
    let random = Math.floor(Math.random() * (this.state.collected.length - 0) + 0)
    let random2 = Math.floor(Math.random() * (this.state.collected.length - 0) + 0)
    if (random == random2) { random2 = Math.floor(Math.random() * (this.state.collected.length - 0) + 0)}
    let dip = [{left: this.state.collected[random], right: this.state.collected[random2]}]
    this.addScrape(dip, 'image')
    this.setState({printed:this.state.printed+1})
  }

  makeSpread = (item) => {
    if(item.type === 'Image'){
        return (
          <ImageLayout url={item.url} id={item.id} title={item.title}/>
        )
      } else if (item.type === 'Text') {
        return (
          <TextLayout className='text' content={item.content} id={item.id} title={item.title}/>
        )
      } else if (item.type === 'Link') {
        return (
          <LinkLayout className='text' id={item.id} title={item.title} url={item.url} image={item.image} />
        )
      }
  }

  makePage = (item, index) => {
    let left = {}
    let right = {}
    item.map((item) => {
      left = item.left
      right = item.right
    })
    return (
      <div className={'page'} key={index}>
        <div className={'left'}>
          <p className='title'>{left.title + '\nadded by ' + left.user}</p>
          {this.makeSpread(left)}
        </div>
        <div className='split'></div>
        <div className={'right'}>
          <p className='title'>{right.title + '\nadded by ' + right.user}</p>
          {this.makeSpread(right)}
        </div>
      </div>
    )
  }

  getConnections = (block) => {
    let connections
    const getChannels = fetch(`${config.apiBase}/blocks/${block}/channels`)
    getChannels.then(resp => resp.json()).then(response => {
        connections = response.channels
    })
  }

  getArenaChannel = (channel) => {
    this.addScrape('checking are.na', 'command')

    const getItems = fetch(`${config.apiBase}/channels/${channel}/contents`)
      getItems.then(resp => resp.json()).then(response => {
        let items = response.contents.filter(function(item){
          return item.class === 'Image' || item.class === 'Text' || item.class === 'Link'
        })

        if (response.contents.length !== this.state.response.length) {
          console.log(response.contents.length)
          console.log(this.state.collected.length)
          this.addScrape('got new items', 'command')
          let collected = items.map((item) => {
            if(item.class === 'Image'){
              this.addScrape(item.title, 'text')
              return item = {
                url: item.image.original.url,
                title: item.generated_title,
                id: item.id,
                type: item.class,
                user: item.connected_by_username,}
            } else if (item.class === 'Text') {
              this.addScrape(item.title, 'text')
              let channels = this.getConnections(item.id)
              return item = {
                content: item.content,
                title: item.generated_title,
                id: item.id,
                type: item.class,
                user: item.connected_by_username}
            } else if (item.class === 'Link') {
              this.addScrape(item.title, 'text')
              let channels = this.getConnections(item.id)
              return item = {
                url: item.source.url,
                image: item.image.original.url,
                title: item.generated_title,
                id: item.id,
                type: item.class,
                user: item.connected_by_username}
            } else {
              return undefined
            }
          })
          this.setState({collected: collected, loaded: true, pageCount: collected.length+this.state.pageCount, response: response.contents});
          this.createDip()
        } else {
          this.addScrape('nothing new', 'command')
          this.addScrape('constructing new diptych', 'command')
          this.createDip()
        }
      })
  }

  render() {
    return (
      <div className="App">
        <div className={'status'}>
          <p className={'working'}>{'working...'}<span className={'pause'} onClick={(e) => this.setState({print: !this.state.print})}>{this.state.print ? '(pause)' : '(start printing)'}</span></p>
          <p className={'printed command'}>{'pages printed ' + this.state.printed}</p>
        </div>
        {this.state.output.map((item, index) => {
          if(item.type === 'text'){
            return <p className={'scrape'} key={index}>{item.content}</p>
          }if(item.type === 'command'){
            return <p className={'command'} key={index}>{item.content}</p>
          } else {
            return this.makePage(item.content, index)
          }
        })}
      </div>
    );
  }
}

export default App;
