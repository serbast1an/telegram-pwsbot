import { lang, vars, helper, subs } from '../core';
import Db from './Db';

function normalizeUserId (userId) {
  const rawUserId = String(userId).trim();
  if (!/^\d+$/.test(rawUserId)) {
    throw {message: lang.get('blacklist_invalid_user_id')}
  }

  const numericUserId = Number(rawUserId);
  if (!Number.isSafeInteger(numericUserId) || numericUserId <= 0) {
    throw {message: lang.get('blacklist_invalid_user_id')}
  }

  return {rawUserId, numericUserId};
}

class BlackList extends Db
{
  /**
   * 取消封锁一个用户，透过ID
   * @param  {Int} userId 用户ID
   * @return {String}        成功返回文案，失败抛出异常
   */
  unbanWithUserId (userId) {
    const {rawUserId, numericUserId} = normalizeUserId(userId);
    const conditions = [{id: numericUserId}, {id: rawUserId}];
    let found = false;

    // 同时兼容回复稿件产生的数字 ID，以及旧版 /ban <ID> 保存的字符串 ID。
    conditions.forEach(condition => {
      if (this.has(condition)) {
        this.del(condition);
        found = true;
      }
    });

    if (found) {
      return lang.get('blacklist_unban_only_id', {id: numericUserId});
    }
    throw {message: lang.get('blacklist_unban_notexists')}
  };
  /**
   * 从管理员的指令消息包含的稿件里解除封锁某个用户
   * @param  {[type]} repMsg 用户用 /unban 命令回复的那个消息
   * @return {String}        成功返回文案，失败抛出异常
   */
  unbanWithMessage (repMsg) {
    let message = subs.getMsgWithReply(repMsg);
    if (!message) {throw { message: lang.get('sub_not_exists') }};
    let condition = {id: message.from.id};
    let userinfo = lang.getUser(message.from);
    // 若用户已经被封锁
    if (blacklist.has(condition)) {
      blacklist.del(condition);
      return lang.get('blacklist_unban', userinfo);
    }
    throw {message: lang.get('blacklist_unban_notexists')}
  };
  /**
   * 透过UserID封锁用户
   * @param  {[type]} userId [description]
   * @return {[type]}        [description]
   */
  banWithUserId (userId) {
    const {rawUserId, numericUserId} = normalizeUserId(userId);
    const condition = {id: numericUserId};
    const legacyCondition = {id: rawUserId};

    if (this.has(condition) || this.has(legacyCondition)) {
      throw {message: lang.get('blacklist_exists_only_id', condition)}
    }
    this.add(condition);
    return lang.get('blacklist_success_only_id', condition);
  };
  /**
   * 透过用户指令来封锁用户
   * @param  {[type]} repMsg 用户用 /unban 命令回复的那个消息
   * @return {[type]}     [description]
   */
  banWithMessage (repMsg) {
    let message = subs.getMsgWithReply(repMsg);
    if (!message) { throw { message: lang.get('sub_not_exists') }}
    let userinfo = lang.getUser(message.from);
    // 若用户已经被封锁
    if (this.has({id: message.from.id})) {
      throw {message: lang.get('blacklist_exists', userinfo)}
    }
    this.add(message.from);
    return lang.get('blacklist_success', userinfo);
  };

}

const blacklist = new BlackList('blacklist');

export default blacklist;
