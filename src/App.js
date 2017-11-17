import React, { Component } from 'react';
import config from './config'
import ImageLayout from './components/ImageLayout'
import TextLayout from './components/TextLayout'
import LinkLayout from './components/LinkLayout'
import './App.css';

import notes from './notes.png'

let conn = []

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      channel: 'test-print',
      output: [
        {
          text: 'loading next dyptich... ',
          type: 'command'
        }
      ],
      currentPage: [
        {
          left: '',
          right: ''
        }
      ],
      collected: [],
      response: [],
      print: false,
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
    this.state.print ? setTimeout(window.print() , 10000) : console.log('')
  }

  addScrape = (item, type) =>{
    let newScrape = this.state.output
    newScrape.unshift({content: item, type: type})
    this.setState({output: newScrape})
  }

  createDip = () => {
    let testArray = this.state.collected

    function compare(a,b) {
      if (a.printed < b.printed)
        return -1;
      if (a.printed > b.printed)
        return 1;
      return 0;
    }
    testArray.sort(compare);

    function weightedRandom(min, max) {
      return Math.round(max / (Math.random() * max + min));
    }

    let length = testArray.length-1
    let wrn = weightedRandom(testArray[0].printed+1, testArray[length].printed)
    let wrn2 = weightedRandom(testArray[1].printed+1, testArray[length].printed)
    if (wrn == wrn2) { wrn2+=2}

    let getChannels = fetch(`${config.apiBase}/blocks/${testArray[wrn].id}/channels`)
    getChannels.then(resp => resp.json()).then(response => {
        let conn = response.channels
        let getChannels2 = fetch(`${config.apiBase}/blocks/${testArray[wrn2].id}/channels`)
        getChannels2.then(resp => resp.json()).then(response => {
          testArray[wrn].printed += 1
          testArray[wrn2].printed += 1
          testArray[wrn].connections = conn
          testArray[wrn2].connections = response.channels
          let dip = [{left: testArray[wrn], right: testArray[wrn2]}]
          this.addScrape(dip, 'image')
          this.setState({printed:this.state.printed+1, collected: testArray})
        })
    })

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
      <div className={'spread'}>
      <div className={'page'} key={index}>
        <div className={'left'}>
          <p className='title'>{left.title + '\nadded by ' + left.user}</p>
          {this.makeSpread(left)}
          <div className='connections'>
            <p>{left.connections.length + ' connections'}</p>
            {left.connections.map((item, key) => {
              return <p key={key+item.id}>{item.title + '\nadded by ' + item.user.username}</p>
            })}
          </div>
        </div>
        <div className='split'></div>
        <div className='draw'>draw</div>
        <div className={'right'}>
          <img src={notes}/>
        </div>
      </div>
      <div className={'page second'} key={index}>
        <div className={'left'}>
          <p className='title'>{right.title + '\nadded by ' + right.user}</p>
          {this.makeSpread(right)}
          <div className='connections'>
            <p>{right.connections.length + ' connections'}</p>
            {left.connections.map((item, key) => {
              return <p key={key+item.id}>{item.title + '\nadded by ' + item.user.username}</p>
            })}
          </div>
        </div>
        <div className='split'></div>
        <div className='draw'>draw</div>
        <div className={'right'}>
          <img src={notes}/>
        </div>
      </div>
    </div>
    )
  }

  getArenaChannel = (channel) => {
    this.addScrape('checking are.na', 'command')

    const getItems = fetch(`${config.apiBase}/channels/${channel}/contents`)
      getItems.then(resp => resp.json()).then(response => {
        let items = response.contents.filter(function(item){
          return item.class === 'Image' || item.class === 'Text' || item.class === 'Link'
        })

        if (response.contents.length !== this.state.response.length) {
          this.addScrape('got new items', 'command')

          let collected = items.map((item) => {
            if(item.class === 'Image'){
              this.addScrape(item.generated_title, 'text')
              return item = {
                url: item.image.original.url,
                title: item.generated_title,
                id: item.id,
                type: item.class,
                user: item.connected_by_username,
                printed: 0,
              }
            } else if (item.class === 'Text') {
              this.addScrape(item.generated_title, 'text')
              // let channels = this.getConnections(item.id)
              return item = {
                content: item.content,
                title: item.generated_title,
                id: item.id,
                type: item.class,
                user: item.connected_by_username,
                printed: 0,
              }
            } else if (item.class === 'Link') {
              this.addScrape(item.generated_title, 'text')
              // let channels = this.getConnections(item.id)
              return item = {
                url: item.source.url,
                image: item.image.original.url,
                title: item.generated_title,
                id: item.id,
                type: item.class,
                user: item.connected_by_username,
                printed: 0,
              }
            } else {
              return undefined
            }
          })

          let newItems = collected.slice(this.state.collected.length)
          collected = this.state.collected.concat(newItems)

          function compare(a,b) {
            if (a.printed < b.printed)
              return -1;
            if (a.printed > b.printed)
              return 1;
            return 0;
          }
          collected.sort(compare);

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
