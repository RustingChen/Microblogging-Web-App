import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { uploadArticle, uploadArticleWithoutImg } from './articleActions'

class NewArticle extends Component {



    handleImageChange(e) {
        e.preventDefault()
        let reader = new FileReader();
        reader.onloadend = () => {
            this.preview = reader.result
            this.forceUpdate();
        }
        if (e.target.files.length !== 0) {
            this.file = e.target.files[0];
            reader.readAsDataURL(this.file)
        }

    }

    render() { return (
        <div id="contain-setting">
            <div className="row">
                <div className="col-sm-12">
                    <div>New article</div>
                    <textarea  rows="5" class="newPostBody"
                      placeholder="Add a new article here"
                      id="newArticleTxt"
                      value={ this.message }
                      onChange={(e) => {
                        this.message = e.target.value
                        this.forceUpdate();
                    }}>
                    </textarea>
                </div>
            </div>

            <div className="row">
                <div className="col-sm-5">
                    Add an image
                    <input type="file" id="articleImage" accept="image/*" onChange={(e) => this.handleImageChange(e)}/>
                </div>
            { !this.file && !this.message ? '' :
                <div className="col-sm-2">
                    <div className="text-right">
                        <input className="btn btn-primary" type="button" value="Add new article" id="newArticleBtn"
                            onClick={() => {
                               console.log("this.message="+this.message)
                                this.props.dispatch(uploadArticle(this.message, this.file))
                                this.message = ''
                                this.file = undefined;
                                document.getElementById('articleImage').value = null;
                                this.forceUpdate()
                            }}/>
                    </div>

                </div>
            }
            </div>

        { !this.file ? '' :
            <div className="row">
                    <img className="postImage" src={this.preview}/>
                    <div>
                    { this.file.webkitRelativePath || this.file.name }<br/>
                    ({ parseInt(this.file.size / 1024 * 100)/100.0 } kB)
                    </div>
            </div>

        }
        </div>
    )}
}

export default connect()(NewArticle)



/** WEBPACK FOOTER **
 ** ./src/components/article/newArticle.js
 **/
