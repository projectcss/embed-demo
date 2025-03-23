const styles = `
  .app-bubbleItem {
     width:40px;
     height:40px;
     display:flex;
     align-items: center;
     justify-content: center;
     position:fixed;
     z-index:1000;
     cursor:pointer;
     bottom:200px;
     right:8px;
     border-radius:50%;
     background: #fff;
     box-shadow: 0 4px 8px 0 rgba(7,12,20,0.16);
  }
  .app-bubbleImage {
     width: 38px;
     height: 38px;
     border-radius: 50%;
  }
  .app-bubbleContent {
      width:min(400px,90vw);
      height:calc(100% - 32px);
      min-height:400px;
      max-height:1200px;
      position:fixed;
      z-index:1000;
      top:16px;
      right:16px;
      background: #f2f5f9;
      border-radius: 12px;
      box-shadow: 0 2px 8px 0 rgba(7,12,20,0.12);
      display: flex;
      flex-direction: column;
  }
 .app-bubbleIfream {
     width:100%;
     border:none;
     flex: 1;
     border-radius: 12px;
  }
  .app-bubbleContentHeader {
     box-sizing: border-box;
     position:absolute;
     top:10px;
     right:10px;
     display:flex;
     align-items: center;
     flex-direction: row-reverse;
  }
  .app-closeIcon {
     font-size: 16px;
     color: #151b26;
     cursor:pointer;
  }
  .app-disabled-tooltip {
     bottom:188px;
     right:60px;
     position:fixed;
     background: #fff;
     box-shadow: 0 2px 8px 0 rgba(7,12,20,0.12);
     border-radius: 6px;
     padding: 12px;
     font-size: 14px;
     color: #151b26;
     line-height: 22px;
     font-weight: 400;
     display: none;

     a {
       color: #2468f2;
       text-decoration: none;
       outline: none;
     }
  }
`;

class EmbedLiteSDK {
    /** 默认头像 */
    shareDefaultImage: string = 'https://bj.bcebos.com/v1/agi-dev-platform-bos/wx_program/da0bf4441a17a92fa3ec1dd44.png?authorization=bce-auth-v1%2FALTAKGa8m4qCUasgoljdEDAzLm%2F2024-07-04T07%3A39%3A15Z%2F-1%2Fhost%2Fc49ccf35fd7327631fe7c9452f60a58b6d368ace3e1c71d5fc5d5439830f57f8';

    /** 气泡div id:  */
    bubbleDivId: string = 'embed-lite';

    /** 气泡图片 id:  */
    bubbleImageId: string = 'embed-lite-bubble-image';

    /** tooltip id:  */
    bubbleTooltipId: string = 'embed-lite-bubble-tooltip';

    /** 气泡div id:  */
    bubbleConversationId: string = 'app-conversation';

    /** 是否已渲染对话窗口 */
    isRenderConversation: boolean = false;

    /** 是否鼠标移入浮层气泡 */
    isMouseInTooltip: boolean = false;

    /** 应用id */
    appId: string = '';

    /** 应用token */
    code: string = '';

    /** 应用基础数据 */
    appDetail: EmbedLiteSDK.IAppDetail | undefined = undefined;

    constructor(config: EmbedLiteSDK.IEmbedLiteSDKConfig) {
        this.appId = config.appId;
        this.code = config.code;

        // 启动渲染
        try {
            // 初始化样式
            this.initStyles();
            // 启动渲染
            this.renderBubble();
            this.renderToolTip();
            // 启动应用详情请求
            void this.fetchAppDetail();
        }
        catch (error) {
            // 获取html异常错误捕获
            this.renderErrorHTML(error);
        }
    }

    /** 检查当前url是否有权限加载气泡 | urls为空代表代表所有url都有权限，如果urls不为空，则代表只有urls中包含的url有权限 */
    private readonly checkUrlPermission = (urls: string[]): boolean => urls.length === 0 || urls.includes(window.location.origin);

    /** 渲染请求到的image图片 */
    private readonly renderImageSrc = (imageUrl: string): void => {
        // 查找气泡元素
        const image: HTMLImageElement | null = document.querySelector(`#${this.bubbleImageId}`);

        if (image) {
            image.src = imageUrl;
        }
    };

    /** 渲染请求到的image图片 */
    private readonly setBubbleClick = (): void => {
        // 查找气泡元素
        const divContent: HTMLElement | null = document.querySelector(`#${this.bubbleImageId}`);

        // 添加点击事件
        if (divContent) {
            divContent.addEventListener('click', this.bubbleClick);
        }
    };

    /** 设置禁用气泡交互 */
    private readonly setImageDisabled = (): void => {
        // 查找气泡元素
        const bubbleDiv: HTMLElement | null = document.querySelector(`#${this.bubbleDivId}`);

        // 查找tooltip元素
        const bubbleTooltipDiv: HTMLElement | null = document.querySelector(`#${this.bubbleTooltipId}`);

        if (bubbleDiv) {
            // 移除点击事件
            bubbleDiv.removeEventListener('click', this.bubbleClick);
            bubbleDiv.style.opacity = '0.4';

            // 添加鼠标hover交互
            bubbleDiv.addEventListener('mouseenter', () => {
                if (bubbleTooltipDiv) {
                    bubbleTooltipDiv.style.display = 'flex';
                }
            });

            bubbleDiv.addEventListener('mouseleave', () => {
                if (bubbleTooltipDiv) {
                    setTimeout(() => {
                        if (!this.isMouseInTooltip) {
                            bubbleTooltipDiv.style.display = 'none';
                        }
                    }, 100);
                }
            });
        }

        if (bubbleTooltipDiv) {
            // 添加鼠标hover交互
            bubbleTooltipDiv.addEventListener('mouseenter', () => {
                bubbleTooltipDiv.style.display = 'block';
                this.isMouseInTooltip = true;
            });

            bubbleTooltipDiv.addEventListener('mouseleave', () => {
                bubbleTooltipDiv.style.display = 'none';
                this.isMouseInTooltip = false;
            });
        }
    };

    /** 禁用头像操作 & 设置默认头像 */
    private readonly setDefaultImage = () => {
        this.renderImageSrc(this.shareDefaultImage);
        this.setImageDisabled();
    };

    /** 获取应用详情 */
    private readonly fetchAppDetail = async () => {
        this.renderImageSrc(this.shareDefaultImage);
        this.setBubbleClick();
    };

    /** 创建气泡顶部html */
    private readonly createHeaderDOM = (): ChildNode | null => {
        const htmlString = `
        <div class="app-bubbleContentHeader">
            <span class="app-closeIcon" id="app-closeIcon">
                <svg width="16" height="16">
                    <path d="m12.596 3.404-9.192 9.193m9.192-.001L3.403 3.404" fill="none" stroke="currentColor" stroke-linecap="round" />
                </svg>
            </span>
        </div>
      `;

        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');

        const div = doc.body.firstChild;

        return div;
    };

    /** 气泡正常状态下点击事件 */
    private readonly bubbleClick = (): void => {
        if (!this.isRenderConversation) {
            this.renderIfream();
            this.hideBubble();
            return;
        }

        this.reRenderIfream();
        this.hideBubble();
    };

    /** 初始化样式 */
    private readonly initStyles = (): void => {
        const style = document.createElement('style');
        style.append(document.createTextNode(styles));
        document.head.append(style);
    };

    /** 隐藏初始态小气泡 */
    private readonly hideBubble = (): void => {
        // 查找气泡元素
        const bubble: HTMLElement | null = document.querySelector(`#${this.bubbleDivId}`);

        if (bubble) {
            bubble.style.display = 'none';
        }
    };

    /** 显现小气泡 */
    private readonly showBubble = (): void => {
        // 查找气泡元素
        const bubble: HTMLElement | null = document.querySelector(`#${this.bubbleDivId}`);

        if (bubble) {
            bubble.style.display = 'flex';
        }
    };

    /** 隐藏对话话框 */
    private readonly hideConversation = (): void => {
        // 查找气泡元素
        const conversationContent: HTMLElement | null = document.querySelector(`#${this.bubbleConversationId}`);

        if (conversationContent) {
            /** 采用样式控制隐藏，是为了保留对话上下文，避免页面刷新 */
            conversationContent.style.position = 'absolute';
            conversationContent.style.left = '-1000px';
        }
    };

    /** 重新让对话框显现 */
    private readonly reRenderIfream = (): void => {
        // 查找气泡元素
        const conversationContent: HTMLElement | null = document.querySelector(`#${this.bubbleConversationId}`);

        if (conversationContent) {
            conversationContent.style.position = 'fixed';
            conversationContent.style.left = 'auto';
        }
    };

    /** 渲染初始化的气泡 */
    private readonly renderIfream = (): void => {
        // 创建 气泡元素
        const divContent = document.createElement('div');
        divContent.id = this.bubbleConversationId;

        divContent.setAttribute('class', 'app-bubbleContent');

        // 创建 iframe 元素
        const iframe = document.createElement('iframe');

        // 设置 iframe 样式，宽度、高度等
        iframe.setAttribute('class', 'app-bubbleIfream');
        iframe.allow = 'microphone;autoplay';

        iframe.src = 'https://cn.vite.dev/guide/';

        const header = this.createHeaderDOM();
        if (header) {
            divContent.append(header);
        }

        // 将 iframe 添加到div中
        divContent.append(iframe);

        // 将 气泡 添加到页面中
        document.body.append(divContent);

        const closeIcon = document.querySelector('#app-closeIcon');

        if (closeIcon) {
            closeIcon.addEventListener('click', () => {
                this.hideConversation();
                this.showBubble();
            });
        }

        this.isRenderConversation = true;
    };

    /** 执行html渲染插入ifream */
    private readonly renderBubble = (): void => {
        // 创建 气泡元素
        const divContent = document.createElement('div');
        divContent.id = this.bubbleDivId;

        // 创建 气泡元素
        const img = document.createElement('img');
        img.id = this.bubbleImageId;

        img.setAttribute('src', this.shareDefaultImage);

        img.setAttribute('class', 'app-bubbleImage');

        divContent.setAttribute('class', 'app-bubbleItem');

        // 将 iframe 添加到页面中
        divContent.append(img);

        // 将 气泡 添加到页面中
        document.body.append(divContent);
    };

    /** 渲染tooltip */
    private readonly renderToolTip = (): void => {
        const divContent: HTMLDivElement = document.createElement('div');
        divContent.id = this.bubbleTooltipId;
        divContent.textContent = '暂无访问权限，请完成网站配置后刷新重试';

        divContent.setAttribute('class', 'app-disabled-tooltip');

        // 将 气泡 添加到页面中
        document.body.append(divContent);
    };

    /** 渲染html获取异常 */
    private readonly renderErrorHTML = (error: unknown): void => {
        // 创建 异常页面 元素
        const divContent = document.createElement('div');

        // 设置 异常页面 样式，宽度、高度等
        divContent.style.width = '100%';
        divContent.style.height = '100%';

        if (error instanceof Error) {
            divContent.textContent = `html获取异常，请检查appId是否正确，error: ${error.message}`;
        }

        // 将 异常页面 添加到页面中
        document.body.append(divContent);
    };
}

namespace EmbedLiteSDK {
    /** sdk配置参数 */
    export interface IEmbedLiteSDKConfig {
        code: string;
        appId: string;
    }

    /** 应用详情数据 */
    export interface IAppDetail {
        app_id: string;
        app_name: string;
        app_desc: string;
        avatar: string;
        web_name: string;
        urls: string[];
    }

    /** res返回结构 */
    export interface IFetchRes<T> {
        code: string;
        message: string;
        result: T;
    }
}

// 命名建议修改, 调整的唯一一些, 防止冲突
window.EmbedLiteSDK = EmbedLiteSDK;
