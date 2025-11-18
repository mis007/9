/**
 * 动画工具类 - 基于Motion One
 * 提供常用的动画效果
 */

// 注意：这是可选功能，需要先安装Motion One
// npm install @motionone/dom

type AnimationOptions = {
  duration?: number;
  delay?: number;
  easing?: string;
};

class AnimationService {
  private isAvailable = false;
  private animate: any = null;
  private scroll: any = null;

  async init() {
    try {
      // 动态导入Motion One（可选依赖）
      const motion = await import('@motionone/dom');
      this.animate = motion.animate;
      this.scroll = motion.scroll;
      this.isAvailable = true;
      console.log('动画服务已启用');
    } catch (error) {
      console.warn('Motion One未安装，动画功能不可用');
      this.isAvailable = false;
    }
  }

  /**
   * 淡入动画
   */
  fadeIn(
    selector: string | Element,
    options: AnimationOptions = {}
  ): void {
    if (!this.isAvailable || !this.animate) return;

    this.animate(
      selector,
      { opacity: [0, 1] },
      {
        duration: options.duration || 0.4,
        delay: options.delay || 0,
        easing: options.easing || 'ease-out'
      }
    );
  }

  /**
   * 从下方滑入动画
   */
  slideInFromBottom(
    selector: string | Element,
    options: AnimationOptions = {}
  ): void {
    if (!this.isAvailable || !this.animate) return;

    this.animate(
      selector,
      {
        opacity: [0, 1],
        transform: ['translateY(30px)', 'translateY(0)']
      },
      {
        duration: options.duration || 0.6,
        delay: options.delay || 0,
        easing: options.easing || 'ease-out'
      }
    );
  }

  /**
   * 从左侧滑入动画
   */
  slideInFromLeft(
    selector: string | Element,
    options: AnimationOptions = {}
  ): void {
    if (!this.isAvailable || !this.animate) return;

    this.animate(
      selector,
      {
        opacity: [0, 1],
        transform: ['translateX(-30px)', 'translateX(0)']
      },
      {
        duration: options.duration || 0.6,
        delay: options.delay || 0,
        easing: options.easing || 'ease-out'
      }
    );
  }

  /**
   * 缩放进入动画
   */
  scaleIn(
    selector: string | Element,
    options: AnimationOptions = {}
  ): void {
    if (!this.isAvailable || !this.animate) return;

    this.animate(
      selector,
      {
        opacity: [0, 1],
        transform: ['scale(0.9)', 'scale(1)']
      },
      {
        duration: options.duration || 0.5,
        delay: options.delay || 0,
        easing: options.easing || 'ease-out'
      }
    );
  }

  /**
   * 列表交错动画
   */
  staggerList(
    selector: string,
    options: AnimationOptions = {}
  ): void {
    if (!this.isAvailable || !this.animate) return;

    const elements = document.querySelectorAll(selector);
    
    elements.forEach((el, index) => {
      this.animate(
        el,
        {
          opacity: [0, 1],
          transform: ['translateY(20px)', 'translateY(0)']
        },
        {
          duration: options.duration || 0.5,
          delay: (options.delay || 0) + index * 0.1,
          easing: options.easing || 'ease-out'
        }
      );
    });
  }

  /**
   * 滚动触发动画
   */
  animateOnScroll(
    selector: string,
    animationOptions?: AnimationOptions
  ): void {
    if (!this.isAvailable || !this.scroll || !this.animate) return;

    this.scroll(
      this.animate(
        selector,
        {
          opacity: [0, 1],
          transform: ['translateY(50px)', 'translateY(0)']
        },
        {
          duration: animationOptions?.duration || 0.6,
          easing: animationOptions?.easing || 'ease-out'
        }
      ),
      {
        target: document.querySelector(selector),
        offset: ['start 0.8', 'start 0.5']
      }
    );
  }

  /**
   * 脉冲动画
   */
  pulse(
    selector: string | Element,
    options: AnimationOptions = {}
  ): void {
    if (!this.isAvailable || !this.animate) return;

    this.animate(
      selector,
      {
        transform: ['scale(1)', 'scale(1.05)', 'scale(1)']
      },
      {
        duration: options.duration || 0.6,
        delay: options.delay || 0,
        easing: options.easing || 'ease-in-out',
        repeat: Infinity,
        direction: 'alternate'
      }
    );
  }

  /**
   * 摇晃动画
   */
  shake(
    selector: string | Element,
    options: AnimationOptions = {}
  ): void {
    if (!this.isAvailable || !this.animate) return;

    this.animate(
      selector,
      {
        transform: [
          'translateX(0)',
          'translateX(-10px)',
          'translateX(10px)',
          'translateX(-10px)',
          'translateX(10px)',
          'translateX(0)'
        ]
      },
      {
        duration: options.duration || 0.5,
        delay: options.delay || 0,
        easing: 'ease-in-out'
      }
    );
  }
}

// 导出单例
export const animationService = new AnimationService();

/**
 * 使用示例：
 * 
 * // 在App.tsx中初始化
 * useEffect(() => {
 *   animationService.init();
 * }, []);
 * 
 * // 在组件中使用
 * useEffect(() => {
 *   // 淡入动画
 *   animationService.fadeIn('.welcome-text');
 *   
 *   // 从下方滑入
 *   animationService.slideInFromBottom('.card', { delay: 0.2 });
 *   
 *   // 列表交错动画
 *   animationService.staggerList('.spot-item');
 *   
 *   // 滚动触发
 *   animationService.animateOnScroll('.lazy-section');
 * }, []);
 * 
 * // React组件示例
 * const SpotCard = ({ spot }) => {
 *   const cardRef = useRef<HTMLDivElement>(null);
 *   
 *   useEffect(() => {
 *     if (cardRef.current) {
 *       animationService.scaleIn(cardRef.current, { delay: 0.1 });
 *     }
 *   }, []);
 *   
 *   return <div ref={cardRef}>...</div>;
 * };
 */
