<template>
  <div class="article-editor">
    <div class="page-header">
      <h2 class="page-title">{{ isEdit ? '编辑文章' : '新建文章' }}</h2>
      <el-space>
        <el-button @click="goBack">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          保存
        </el-button>
      </el-space>
    </div>
    
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="80px"
      v-loading="loading"
    >
      <el-form-item label="标题" prop="title">
        <el-input v-model="form.title" placeholder="请输入文章标题" size="large" />
      </el-form-item>
      
      <el-form-item label="摘要" prop="summary">
        <el-input
          v-model="form.summary"
          type="textarea"
          :rows="3"
          placeholder="请输入文章摘要"
        />
      </el-form-item>
      
      <el-form-item label="标签" prop="tags">
        <el-input
          v-model="form.tagsInput"
          placeholder="请输入标签，用逗号分隔"
        />
      </el-form-item>
      
      <el-form-item label="正文" prop="body">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="编辑" name="edit">
            <el-input
              v-model="form.body"
              type="textarea"
              :rows="20"
              placeholder="请输入 Markdown 格式的文章正文"
              class="markdown-editor"
            />
          </el-tab-pane>
          <el-tab-pane label="预览" name="preview">
            <div class="preview-content" v-html="renderedContent"></div>
          </el-tab-pane>
        </el-tabs>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { marked } from 'marked'
import api from '../../api'

const route = useRoute()
const router = useRouter()

const formRef = ref(null)
const loading = ref(false)
const saving = ref(false)
const activeTab = ref('edit')

const isEdit = computed(() => !!route.params.id)

const form = reactive({
  title: '',
  body: '',
  summary: '',
  tagsInput: ''
})

const rules = {
  title: [
    { required: true, message: '请输入文章标题', trigger: 'blur' }
  ],
  body: [
    { required: true, message: '请输入文章正文', trigger: 'blur' }
  ]
}

// Configure marked
marked.setOptions({
  breaks: true,
  gfm: true
})

const renderedContent = computed(() => {
  if (!form.body) return '<p>暂无内容</p>'
  return marked(form.body)
})

// Canonical tag rule, identical to the backend:
// split on commas, trim, drop empty entries, drop duplicates (first wins).
function parseTagsInput(value) {
  const seen = new Set()
  return (value || '')
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => {
      if (tag.length === 0 || seen.has(tag)) return false
      seen.add(tag)
      return true
    })
}

onMounted(() => {
  if (isEdit.value) {
    fetchArticle()
  }
})

async function fetchArticle() {
  loading.value = true
  try {
    const response = await api.get(`/articles/${route.params.id}`)
    const article = response.data
    form.title = article.title
    form.body = article.body
    form.summary = article.summary
    form.tagsInput = article.tags.join(', ')
  } catch (error) {
    console.error('Failed to fetch article:', error)
    ElMessage.error('获取文章失败')
    router.push('/admin/articles')
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    saving.value = true
    try {
      // Parse tags from comma-separated input
      const tags = parseTagsInput(form.tagsInput)
      
      const articleData = {
        title: form.title,
        body: form.body,
        summary: form.summary,
        tags: tags
      }
      
      if (isEdit.value) {
        await api.put(`/articles/${route.params.id}`, articleData)
        ElMessage.success('文章已更新')
      } else {
        await api.post('/articles', articleData)
        ElMessage.success('文章已创建')
      }
      
      router.push('/admin/articles')
    } catch (error) {
      console.error('Failed to save article:', error)
      const message = error.response?.data?.error || '保存文章失败'
      ElMessage.error(message)
    } finally {
      saving.value = false
    }
  })
}

function goBack() {
  router.push('/admin/articles')
}
</script>

<style scoped>
.article-editor {
  padding-top: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  color: #303133;
  margin: 0;
}

.markdown-editor :deep(textarea) {
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 14px;
}

.preview-content {
  padding: 16px;
  background-color: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  min-height: 400px;
  max-height: 600px;
  overflow-y: auto;
}

.preview-content :deep(h1) {
  font-size: 24px;
  margin: 16px 0;
}

.preview-content :deep(h2) {
  font-size: 20px;
  margin: 14px 0;
}

.preview-content :deep(h3) {
  font-size: 18px;
  margin: 12px 0;
}

.preview-content :deep(pre) {
  background-color: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
}

.preview-content :deep(code) {
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 14px;
}

.preview-content :deep(p) {
  margin-bottom: 12px;
}
</style>
