// 云数据存储层：基于 WorkBuddy 云数据库（smoke_records / smoke_goals）
// owner_id 由数据库 DEFAULT auth.uid() 自动填充，前端不发送。
const { cloud } = require('./cloud')

function toAppRecord(r) {
  return {
    id: r.id,
    timestamp: new Date(r.smoked_at).getTime(),
    trigger: r.trigger || '',
    location: r.location || '',
    note: r.note || ''
  }
}

function defaultGoals() {
  return {
    id: null,
    dailyLimit: 10,
    pricePerPack: 30,
    cigarettesPerPack: 20,
    startDate: new Date().toISOString().slice(0, 10),
    quitMode: false
  }
}

async function getRecords() {
  const { data, error } = await cloud.database
    .from('smoke_records')
    .select('id, trigger, location, note, smoked_at')
    .order('smoked_at', { ascending: false })
  if (error) throw error
  return (data || []).map(toAppRecord)
}

async function addRecord(record) {
  const { data, error } = await cloud.database
    .from('smoke_records')
    .insert({
      trigger: record.trigger || '',
      location: record.location || '',
      note: record.note || '',
      smoked_at: new Date(record.timestamp || Date.now()).toISOString()
    })
    .select()
  if (error) throw error
  const row = Array.isArray(data) ? data[0] : null
  return row ? toAppRecord(row) : null
}

async function removeRecord(id) {
  const { data, error } = await cloud.database
    .from('smoke_records')
    .delete()
    .eq('id', id)
    .select()
  if (error) throw error
  return data
}

async function getGoals() {
  const { data, error } = await cloud.database
    .from('smoke_goals')
    .select('id, daily_limit, price_per_pack, cigarettes_per_pack, start_date, quit_mode')
    .maybeSingle()
  if (error || !data) return defaultGoals()
  return {
    id: data.id,
    dailyLimit: data.daily_limit,
    pricePerPack: Number(data.price_per_pack),
    cigarettesPerPack: data.cigarettes_per_pack,
    startDate: data.start_date,
    quitMode: !!data.quit_mode
  }
}

async function setGoals(goals) {
  const existing = await getGoals()
  const payload = {
    daily_limit: goals.dailyLimit,
    price_per_pack: goals.pricePerPack,
    cigarettes_per_pack: goals.cigarettesPerPack,
    start_date: goals.startDate,
    quit_mode: !!goals.quitMode
  }
  if (existing && existing.id) {
    const { error } = await cloud.database
      .from('smoke_goals')
      .update(payload)
      .eq('id', existing.id)
    if (error) throw error
  } else {
    const { error } = await cloud.database
      .from('smoke_goals')
      .insert(payload)
    if (error) throw error
  }
  return goals
}

async function clearAll() {
  // RLS 会自动只删除当前用户自己的记录
  const { error } = await cloud.database
    .from('smoke_records')
    .delete()
  if (error) throw error
}

module.exports = { getRecords, addRecord, removeRecord, getGoals, setGoals, clearAll }
