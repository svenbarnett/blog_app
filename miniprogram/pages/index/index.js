//index.js
//获取应用实例
const app = getApp()
const jinrishici = require('../../utils/jinrishici.js')
const request = require('../../utils/request.js');
let util = require('../../utils/util.js');
let touchDotX = 0;//X按下时坐标
let touchDotY = 0;//y按下时坐标
let interval;//计时器
let time = 0;//从按下到松开共多少时间*100

Page({
    data: {
        StatusBar: app.globalData.StatusBar,
        CustomBar: app.globalData.CustomBar,
        Custom: app.globalData.Custom,
        BlogName: app.globalData.BlogName,
        HaloUser: app.globalData.HaloUser,
        HaloPassword: app.globalData.HaloPassword,
        miniProgram: app.globalData.miniProgram,
        hasUserInfo: false,
        canIUse: wx.canIUse('button.open-type.getUserInfo'),
        userInfo: {},
        cardIdex: 1,
        randomNum: 0,
        animationTime: 1,
        moreFlag: false,
        pages: 0,
        cardCur: 0,
        TabCur: 0,
        scrollLeft: 0,
        openid: '',
        Role: '游客',
        roleFlag: false,
        adminOpenid: app.globalData.adminOpenid,
        bottomImg: app.globalData.url + app.globalData.bottomImg,
        colourList: [{
            colour: 'bg-red'
        }, {
            colour: 'bg-orange'
        }, {
            colour: 'bg-yellow'
        }, {
            colour: 'bg-olive'
        }, {
            colour: 'bg-green'
        }, {
            colour: 'bg-cyan'
        }, {
            colour: 'bg-blue'
        }, {
            colour: 'bg-purple'
        }, {
            colour: 'bg-mauve'
        }, {
            colour: 'bg-pink'
        }, {
            colour: 'bg-lightBlue'
        }],
        categories : [{name:"全部",slug:"all"}],
        isPasswordShow : false,
        password : null,
        secretUrl : null,
        footer : {
            since : null,
            end : null,
            beian : null,
            author : null
        }
    },
    /**
     * 监听屏幕滚动 判断上下滚动
     */
    onPageScroll: function (event) {
        this.setData({
            scrollTop: event.detail.scrollTop
        })
    },
    //事件处理函数
    bindViewTap: function() {
        wx.navigateTo({
            url: '../logs/logs'
        })
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        var userInfo = wx.getStorageSync('userInfo')
        if (userInfo) {
            this.setData({
                userInfo: userInfo,
                hasUserInfo: true
            })
            this.getPermissions()
        }
    },

    onLoad: function () {
        var that = this
        // 在页面中定义插屏广告
        let interstitialAd = null

        // 在页面onLoad回调事件中创建插屏广告实例
        if (wx.createInterstitialAd) {
        interstitialAd = wx.createInterstitialAd({
            adUnitId: 'adunit-3ccb0796a9c5582a'
        })
        interstitialAd.onLoad(() => {})
        interstitialAd.onError((err) => {})
        interstitialAd.onClose(() => {})
        }

        // 在适合的场景显示插屏广告
        if (interstitialAd) {
        interstitialAd.show().catch((err) => {
            console.error(err)
        })
        }
        // 每日诗词
        jinrishici.load(result => {
            // 下面是处理逻辑示例
            this.setData({ 
                jinrishici: result.data.content
            });
        });
        var token = app.globalData.token;
        // 查site信息
        var urlSiteInfo = app.globalData.url + '/api/site.json';
        request.requestGetApi(urlSiteInfo, token, {}, this, function(res){
            // console.log(res)
            res.footer['end'] = new Date().getFullYear()
            res.footer['author'] = res.author
            that.setData({
                footer : res.footer
            })
        })
        // banner
        var bannerPostList = app.globalData.url + '/api/posts/1.json';
        request.requestGetApi(bannerPostList, token, {}, this, function(res){
            // console.log(res)
            var list = res.data;
            for (let i = 0; i < list.length; ++i) {
                list[i].id = list[i].slug
                var cover = list[i].cover ? list[i].cover : app.globalData.defaultImg
                list[i].thumbnail = app.globalData.url + cover
                list[i].createTime = util.hexoFormatTime(list[i].date);
            }
            that.setData({
                bannerPost: res.data,
            });
        })
        // 分类
        var urlCategoriesList = app.globalData.url + '/api/categories.json';
        request.requestGetApi(urlCategoriesList, token, null, this, function(res){
            // console.log(res)
            res.forEach(element => {
                that.data.categories.push({name: element.name, slug: element.path})
            });
            
            that.setData({
                categories : that.data.categories
            })
        });
        // 初始化第一页
        this.getPostsByPage(this.data.pages)
    },

    getPostsByPage: function(page){
        page = page + 1;
        var urlPostList = app.globalData.url + "/api/posts/"+page+".json";
        var token = app.globalData.token;
        var params = {};
        //@todo 文章内容网络请求API数据
        console.log(urlPostList)
        request.requestGetApi(urlPostList, token, params, this, this.successPostList, this.failPostList);
    },

    getUserProfile: function () {
        var that = this;
        wx.getUserProfile({
            desc: '用于完善用户资料',
            success: (res) => {
                if (res.errMsg == "getUserProfile:ok") {
                    wx.setStorageSync('userInfo',res.userInfo)
                    app.globalData.userInfo = res.userInfo
                    that.setData({
                        userInfo: res.userInfo,
                        hasUserInfo: true,
                    })
                    that.getPermissions()
                }
            } ,fail: err => {
                wx.showToast({
                    title: '授权后才能体验更多功能哦',
                    icon: 'none',
                    duration: 3000
                })
            },
        })
    },

    getPermissions: function () {
        var that = this;
            wx.cloud.callFunction({
                name: 'get_wx_context',
                success(res) {
                    wx.setStorageSync('openid',res.result.openid)
                    var role = res.result.openid == that.data.adminOpenid ? '管理员':'游客'
                    app.globalData.roleFlag = res.result.openid == that.data.adminOpenid;
                    that.setData({
                        Role: role,
                        roleFlag: res.result.openid == that.data.adminOpenid,
                    });
                },
            })
    },

    DotStyle(e) {
        this.setData({
            DotStyle: e.detail.value
        })
    },
    // cardSwiper
    cardSwiper(e) {
        this.setData({
            cardCur: e.detail.current
        })
    },
    // towerSwiper
    // 初始化towerSwiper
    towerSwiper(name) {
        let list = this.data[name];
        for (let i = 0; i < list.length; i++) {
            list[i].zIndex = parseInt(list.length / 2) + 1 - Math.abs(i - parseInt(list.length / 2))
            list[i].mLeft = i - parseInt(list.length / 2)
        }
        this.setData({
            swiperList: list
        })
    },
    // towerSwiper触摸开始
    towerStart(e) {
        this.setData({
            towerStart: e.touches[0].pageX
        })
    },
    // towerSwiper计算方向
    towerMove(e) {
        this.setData({
            direction: e.touches[0].pageX - this.data.towerStart > 0 ? 'right' : 'left'
        })
    },
    // towerSwiper计算滚动
    towerEnd(e) {
        let direction = this.data.direction;
        let list = this.data.swiperList;
        if (direction == 'right') {
            let mLeft = list[0].mLeft;
            let zIndex = list[0].zIndex;
            for (let i = 1; i < list.length; i++) {
                list[i - 1].mLeft = list[i].mLeft
                list[i - 1].zIndex = list[i].zIndex
            }
            list[list.length - 1].mLeft = mLeft;
            list[list.length - 1].zIndex = zIndex;
            this.setData({
                swiperList: list
            })
        } else {
            let mLeft = list[list.length - 1].mLeft;
            let zIndex = list[list.length - 1].zIndex;
            for (let i = list.length - 1; i > 0; i--) {
                list[i].mLeft = list[i - 1].mLeft
                list[i].zIndex = list[i - 1].zIndex
            }
            list[0].mLeft = mLeft;
            list[0].zIndex = zIndex;
            this.setData({
                swiperList: list
            })
        }
    },
    showModal(e) {
        console.log(e);
        this.setData({
            modalName: e.currentTarget.dataset.target
        })
    },
    hideModal(e) {
        this.setData({
            modalName: null
        })
    },
    tabSelect(e) {
        this.randomNum();
        this.setData({
            postList: [],
        });
        var slug = e.currentTarget.dataset.slug;
        var url = slug != 'all'? '/'+slug : "/api/posts/1.json";
        var urlPostList = app.globalData.url + url;
        var token = app.globalData.token;
        var params = {};
        //@todo 文章内容网络请求API数据
        request.requestGetApi(urlPostList, token, params, this, this.successPostList, this.failPostList);
        this.setData({
            noPostTitle: '',
            moreFlag: true,
            pages: 0,
            TabCur: e.currentTarget.dataset.id,
            scrollLeft: (e.currentTarget.dataset.id - 1) * 60,
            secretUrl : slug
        });
    },
    
    switchSex: function (e) {
        // console.warn(e.detail.value);
        app.globalData.skin = e.detail.value
        console.log(app.globalData.skin)
        this.setData({
            skin: e.detail.value
        });
    }, 
    // 触摸开始事件
    touchStart: function (e) {
        touchDotX = e.touches[0].pageX; // 获取触摸时的原点
        touchDotY = e.touches[0].pageY;
        // 使用js计时器记录时间    
        interval = setInterval(function () {
            time++;
        }, 100);
    },
    // 触摸结束事件
    touchEnd: function (e) {
        let touchMoveX = e.changedTouches[0].pageX;
        let touchMoveY = e.changedTouches[0].pageY;
        let tmX = touchMoveX - touchDotX;
        let tmY = touchMoveY - touchDotY;
        if (time < 20) {
            let absX = Math.abs(tmX);
            let absY = Math.abs(tmY);
            if (absX > 2 * absY) {
                if (tmX < 0) {
                    this.setData({
                        modalName: null
                    })
                } else {
                    this.setData({
                        modalName: "viewModal"
                    })
                }
            }
            if (absY > absX * 2 && tmY < 0) {
                console.log("上滑动=====")
                var moreFlag = this.data.moreFlag;
                if(moreFlag){
                    var page = this.data.pages + 1;
                    this.setData({
                        pages : page
                    })
                    this.getPostsByPage(page);
                }
            }
        }
        clearInterval(interval); // 清除setInterval
        time = 0;
    },
    // 关闭抽屉
    shutDownDrawer: function (e) {
        this.setData({
            modalName: null
        })
    },
    //冒泡事件
    maopao: function (e) {
        console.log("冒泡...")
    },
    showMask: function (e) {
        this.selectComponent("#authorCardId").showMask();
        this.shutDownDrawer();
    },

    //获取随机数
    randomNum: function() {
        var num = Math.floor(Math.random() * 10);
        this.setData({
            randomNum: num
        });
    },

    /**
     * 加载更多
     */
    loadMore: function () {

    },



    /**
     * 文章Banner请求--接口调用成功处理
     */
    successBanner: function (res, selfObj) {
        var that = this;
        var list = res.data.content;
        for (let i = 0; i < list.length; ++i) {
            list[i].createTime = util.customFormatTime(list[i].createTime, 'Y.M.D');
        }
        that.setData({
            bannerPost: res.data.content,
        });
    },
    /**
     * 文章Banner请求--接口调用失败处理
     */
    failBanner: function (res, selfObj) {
        console.error('failBanner', res)
    },


    /**
     * 文章列表请求--接口调用成功处理
     */
    /**
     * 文章列表请求--接口调用成功处理
     */
    successPostList: function (res, selfObj) {
        var that = this;      
        console.log(res)
        var list = this.data.postList?this.data.postList:[]
        var moreFlag = this.data.moreFlag
        var pages = this.data.pages;
        var noPostTitle = "作者会努力更新文章的 . . .";
        if (res.data){
            // all
            res.data.forEach(e =>{
                list.push(e)
            })
            if(pages + 1 < res.pageCount){
                moreFlag = true
                noPostTitle = ""
            }else{
                moreFlag = false
                noPostTitle = "作者会努力更新文章的 . . .";
            }
        }else{
            // 具体分类过来的
            list = res.postlist
            moreFlag = false;
            noPostTitle = "作者会努力更新文章的 . . .";
        }
        for (let i = 0; i < list.length; ++i) {
            list[i].id = list[i].slug
            if (list[i].cover){
                list[i].skin = true
                list[i].thumbnail = app.globalData.url + list[i].cover
            }
            list[i].createTime = util.hexoFormatTime(list[i].date);
        }
        // console.log(list)
        that.setData({
            postList: list,
            moreFlag: moreFlag,
            pages: pages,
            noPostTitle : noPostTitle
        });
    },
    /**
     * 文章列表请求--接口调用失败处理
     */
    failPostList: function (res, selfObj) {
        console.error('failPostList', res)
    },

    /**
     * 后台登入请求--接口调用成功处理
     */
    successAdminLogin: function (res, selfObj) {
        var that = this;
        // that.setData({
        //     access_token: res.data.access_token,
        //     refresh_token: res.data.refresh_token
        // })
        app.globalData.adminToken = res.data.access_token;
        // clearTimeout(delay);
        // console.warn(res)
    },
    /**
     * 后台登入请求--接口调用失败处理
     */
    failAdminLogin: function (res, selfObj) {
        console.error('failAdminLogin', res)
    },

    /**
     * 搜索文章模块
     */
    Search: function(e) {
        var content = e.detail.value.replace(/\s+/g, '');
        // console.log(content);
        var that = this;
        that.setData({
            SearchContent: content,
        });
    },
    SearchSubmit: function (e) {
        // console.warn(this.data.SearchContent);

        var that = this;
        that.setData({
            postList: null,
        });

        var urlPostList = app.globalData.url + '/api/content/posts/search?sort=createTime%2Cdesc&keyword=' + this.data.SearchContent;
        var token = app.globalData.token;
        var params = {};


        //@todo 搜索文章网络请求API数据
        request.requestPostApi(urlPostList, token, params, this, this.successSearch, this.failSearch);
    },
    successSearch: function (res, selfObj) {
        var that = this;
        // console.warn(res.data.content);
        var list = res.data.content;
        for (let i = 0; i < list.length; ++i) {
            list[i].createTime = util.customFormatTime(list[i].createTime, 'Y.M.D');
        }
        if (res.data.content != "") {
            that.setData({
                postList: res.data.content,
                moreFlag: false,
                pages: res.data.pages,
            });
        } else {
            that.setData({
                postList: res.data.content,
                moreFlag: true,
                pages: res.data.pages,
            });
        }
    },
    failSearch: function (res, selfObj) {
        console.error('failSearch', res)
    },

    /**
    * 用户点击右上角分享
    */
    onShareAppMessage: function () {
        return {
            title: this.data.jinrishici,
            path: '/pages/index/index'
            // imageUrl: 'https://www.pswen.cn/images/img/avatar.jpg',
        }
    },
    hidePasswordModal(e) {
        this.setData({
          isPasswordShow: false
        })
    },
    clickPassword (e){

        this.setData({
            isPasswordShow: false
        })
        wx.setStorageSync('password',this.data.password)
        this.randomNum();
        this.setData({
            postList: [],
        });
        var urlPostList = app.globalData.url + "/api/content/categories/"+this.data.secretUrl+"/posts";
        var token = app.globalData.token;
        var params = {
            size: 100,
            sort: 'createTime,desc',
            password : wx.getStorageSync('password')
        };
        //@todo 文章内容网络请求API数据
        request.requestGetApi(urlPostList, token, params, this, this.successPostList, this.failPostList);
        this.setData({
            TabCur: e.currentTarget.dataset.id,
            scrollLeft: (e.currentTarget.dataset.id - 1) * 60
        });
    },
    inputPassword(e){
        this.setData({
            password: e.detail.value
        })
    }
    
})

