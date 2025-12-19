import { useContext, useState, useEffect } from "react";
import { AppContext } from "../../context/AppContext";
import "./Medications.css";

export default function Medications() {
  const { 
    medications, 
    addMedication, 
    updateMedication, 
    registerSale, 
    registerEntry,
    loadMedications,
    isLoading 
  } = useContext(AppContext);
  
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(null);
  const [formData, setFormData] = useState({
    Name: "",
    Amount: "",
    Price: "",
    ExpirationDate: ""
  });
  const [searchProduct, setSearchProduct] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [restockAmount, setRestockAmount] = useState("");
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [shouldRefresh, setShouldRefresh] = useState(false); // ← ESTADO FALTANTE AQUÍ

  // Filtrar productos para la tabla principal
  const filtered = medications.filter(m =>
    m.Name?.toLowerCase().includes(search.toLowerCase())
  );

  // Filtrar productos para la búsqueda en modales
  const modalFilteredProducts = medications.filter(m =>
    m.Name?.toLowerCase().includes(searchProduct.toLowerCase())
  );

  // Efecto para actualizar datos cuando se cierra un modal
  useEffect(() => {
    const refreshAfterModalClose = async () => {
      if (modalOpen === null && shouldRefresh) {
        await loadMedications();
        setShouldRefresh(false);
      }
    };
    
    refreshAfterModalClose();
  }, [modalOpen, shouldRefresh, loadMedications]);

  // Seleccionar producto para venta múltiple
  const handleSelectProduct = (product) => {
    const isAlreadySelected = selectedProducts.some(p => p.medicationID === product.medicationID);
    
    if (isAlreadySelected) {
      setSelectedProducts(prev => 
        prev.filter(p => p.medicationID !== product.medicationID)
      );
    } else {
      setSelectedProducts(prev => [...prev, {
        ...product,
        saleAmount: "1",
        subtotal: parseFloat(product.Price)
      }]);
    }
  };

  // Actualizar cantidad de un producto seleccionado
  const updateProductQuantity = (productId, newAmount) => {
    if (newAmount === "") {
      setSelectedProducts(prev => 
        prev.map(product => {
          if (product.medicationID === productId) {
            return {
              ...product,
              saleAmount: "",
              subtotal: 0
            };
          }
          return product;
        })
      );
      return;
    }
    
    const amountNumber = parseInt(newAmount);
    if (isNaN(amountNumber)) return;
    
    setSelectedProducts(prev => 
      prev.map(product => {
        if (product.medicationID === productId) {
          const productObj = medications.find(m => m.medicationID === productId);
          const maxAmount = productObj ? productObj.Amount : product.Amount;
          const amount = Math.max(1, Math.min(amountNumber, maxAmount));
          return {
            ...product,
            saleAmount: amount.toString(),
            subtotal: parseFloat(product.Price) * amount
          };
        }
        return product;
      })
    );
  };

  // Eliminar producto de la selección
  const removeProduct = (productId) => {
    setSelectedProducts(prev => 
      prev.filter(p => p.medicationID !== productId)
    );
  };

  // Calcular total de la venta
  const calculateTotal = () => {
    return selectedProducts.reduce((total, product) => {
      const amount = parseInt(product.saleAmount) || 0;
      const price = parseFloat(product.Price) || 0;
      return total + (price * amount);
    }, 0);
  };

  // Manejar estado de carga
  if (isLoading) {
    return (
      <div className="medications-container">
        <div className="loading-message">
          <div className="loading-spinner"></div>
          <p>Cargando medicamentos...</p>
        </div>
      </div>
    );
  }

  // Funciones auxiliares
  const getStockClass = (amount) => {
    if (amount < 10) return "low-stock";
    return "normal-stock";
  };

  const getExpirationClass = (dateString) => {
    if (!dateString) return "";
    
    const expirationDate = new Date(dateString);
    const today = new Date();
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    if (expirationDate < today) return "expired";
    if (expirationDate <= thirtyDaysFromNow) return "expiring-soon";
    return "";
  };

  const formatPrice = (price) => {
    return `$${parseFloat(price || 0).toFixed(2)}`;
  };

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 3000);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Agregar nuevo producto
  const handleAddProduct = async () => {
    if (!formData.Name || !formData.Amount || !formData.Price) {
      showNotification("Por favor completa todos los campos obligatorios", "error");
      return;
    }

    const newProduct = {
      Name: formData.Name,
      Amount: parseInt(formData.Amount),
      Price: parseFloat(formData.Price),
      ExpirationDate: formData.ExpirationDate || null
    };

    const result = await addMedication(newProduct);
    
    if (result.success) {
      showNotification("Producto agregado exitosamente");
      setShouldRefresh(true);
      setModalOpen(null);
      setFormData({ Name: "", Amount: "", Price: "", ExpirationDate: "" });
    } else {
      showNotification(result.error || "Error al agregar producto", "error");
    }
  };

  // Realizar venta múltiple - CON MÁS LOGS PARA DEBUGGING (CORREGIDO)
const handleSellProducts = async () => {
  if (selectedProducts.length === 0) {
    showNotification("Por favor selecciona al menos un producto", "error");
    return;
  }

  // Validar que todas las cantidades sean válidas
  const invalidProducts = selectedProducts.filter(p => {
    const amount = parseInt(p.saleAmount);
    return !amount || amount <= 0 || amount > p.Amount;
  });

  if (invalidProducts.length > 0) {
    showNotification(`Cantidades inválidas para ${invalidProducts.length} producto(s)`, "error");
    return;
  }

  setIsProcessingSale(true);
  
  try {
    console.log("=== INICIANDO VENTA ===");
    console.log("Productos seleccionados:", selectedProducts);
    console.log("Medicamentos disponibles:", medications);

    // 1. Primero actualizar todos los medicamentos
    const updateResults = [];
    for (const product of selectedProducts) {
      const saleAmount = parseInt(product.saleAmount);
      const newAmount = product.Amount - saleAmount;
      
      console.log(`\n=== Actualizando producto: ${product.Name} ===`);
      console.log("Producto completo:", product);
      console.log("ID:", product.medicationID);
      console.log("Stock actual:", product.Amount);
      console.log("Cantidad a vender:", saleAmount);
      console.log("Nuevo stock:", newAmount);
      
      // Solo enviar los campos que existen en la tabla medications
      const updateData = {
        Name: product.Name,
        Amount: newAmount,
        Price: product.Price,
        ExpirationDate: product.ExpirationDate
      };
      
      console.log("Datos a enviar para actualizar:", updateData);
      
      const updateResult = await updateMedication(product.medicationID, updateData);
      
      console.log("Resultado de actualización:", updateResult);
      updateResults.push(updateResult);
      
      if (!updateResult.success) {
        throw new Error(`Error al actualizar ${product.Name}: ${updateResult.error}`);
      }
    }

    console.log("\n=== Todos los productos actualizados ===");
    console.log("Resultados:", updateResults);

    // 2. Luego registrar todas las ventas en el historial
    const saleResults = [];
    for (const product of selectedProducts) {
      const saleAmount = parseInt(product.saleAmount);
      
      console.log(`\n=== Registrando venta para: ${product.Name} ===`);
      console.log("Datos de venta:", {
        medicationID: product.medicationID,
        Amount: saleAmount,
        Price: product.Price,
        ExpirationDate: product.ExpirationDate
      });
      
      const saleResult = await registerSale({
        medicationID: product.medicationID,
        Amount: saleAmount,
        Price: product.Price
      });
      
      console.log("Resultado de registro de venta:", saleResult);
      saleResults.push(saleResult);
      
      if (!saleResult.success) {
        console.warn(`Advertencia: Error al registrar venta para ${product.Name}:`, saleResult.error);
      }
    }

    console.log("\n=== Todas las ventas registradas ===");
    console.log("Resultados:", saleResults);

    // 3. Calcular resumen
    const totalAmount = selectedProducts.reduce((sum, p) => sum + parseInt(p.saleAmount), 0);
    const totalValue = calculateTotal();
    
    console.log("\n=== Resumen de venta ===");
    console.log("Total productos:", totalAmount);
    console.log("Total valor:", totalValue);
    
    showNotification(
      `Venta realizada exitosamente: ${totalAmount} productos por un total de ${formatPrice(totalValue)}`
    );
    
    // 4. Limpiar y cerrar
    setSelectedProducts([]);
    setShouldRefresh(true);
    closeModal();
    
  } catch (error) {
    console.error("=== ERROR COMPLETO EN VENTA ===", error);
    showNotification(`Error al procesar la venta: ${error.message}`, "error");
    
    // Intentar recargar los datos para sincronizar
    try {
      await loadMedications();
    } catch (refreshError) {
      console.error("Error al recargar datos después de error:", refreshError);
    }
  } finally {
    setIsProcessingSale(false);
  }
};

  // Aumentar stock - También corregido
  const handleRestockProduct = async () => {
    if (!selectedProducts[0] || !restockAmount || parseInt(restockAmount) <= 0) {
      showNotification("Por favor ingresa una cantidad válida", "error");
      return;
    }

    const product = selectedProducts[0];
    const newAmount = product.Amount + parseInt(restockAmount);
    
    // Solo enviar los campos que existen en la tabla medications
    const updateData = {
      Name: product.Name,
      Amount: newAmount,
      Price: product.Price,
      ExpirationDate: product.ExpirationDate
    };
    
    const updateResult = await updateMedication(product.medicationID, updateData);

    if (updateResult.success) {
      const entryResult = await registerEntry({
        medicationID: product.medicationID,
        Amount: parseInt(restockAmount)
      });

      if (entryResult.success) {
        showNotification(`Stock aumentado: ${restockAmount} unidades añadidas a ${product.Name}`);
      } else {
        showNotification("Stock aumentado pero error al registrar en historial", "warning");
      }
      
      setShouldRefresh(true);
      closeModal();
    } else {
      showNotification("Error al actualizar stock", "error");
    }
  };

  const closeModal = () => {
    setModalOpen(null);
    setFormData({ Name: "", Amount: "", Price: "", ExpirationDate: "" });
    setSearchProduct("");
    setSelectedProducts([]);
    setRestockAmount("");
  };

  // Verificar si un producto está seleccionado
  const isProductSelected = (productId) => {
    return selectedProducts.some(p => p.medicationID === productId);
  };

  return (
    <div className="medications-container">
      {/* Notificación */}
      {notification.show && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Modales */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            
            {/* Modal Agregar Producto */}
            {modalOpen === "add" && (
              <>
                <h3>Agregar Nuevo Producto</h3>
                <div className="form-group">
                  <label>Nombre del Producto *</label>
                  <input
                    type="text"
                    name="Name"
                    value={formData.Name}
                    onChange={handleFormChange}
                    placeholder="Ej: Paracetamol 500mg"
                  />
                </div>
                <div className="form-group">
                  <label>Cantidad Inicial *</label>
                  <input
                    type="number"
                    name="Amount"
                    value={formData.Amount}
                    onChange={handleFormChange}
                    placeholder="Ej: 50"
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label>Precio Unitario ($) *</label>
                  <input
                    type="number"
                    name="Price"
                    value={formData.Price}
                    onChange={handleFormChange}
                    placeholder="Ej: 5.99"
                    min="0.01"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label>Fecha de Expiración</label>
                  <input
                    type="date"
                    name="ExpirationDate"
                    value={formData.ExpirationDate}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="modal-actions">
                  <button className="btn-confirm" onClick={handleAddProduct}>
                    Agregar Producto
                  </button>
                  <button className="btn-cancel" onClick={closeModal}>
                    Cancelar
                  </button>
                </div>
              </>
            )}

            {/* Modal Realizar Venta */}
            {modalOpen === "sell" && (
              <>
                <div className="modal-header-with-steps">
                  <h3>Realizar Venta</h3>
                  <div className="sale-steps">
                    <span className={`step ${selectedProducts.length === 0 ? 'active' : ''}`}>
                      1. Seleccionar productos
                    </span>
                    <span className="step-arrow">→</span>
                    <span className={`step ${selectedProducts.length > 0 ? 'active' : ''}`}>
                      2. Confirmar venta
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Buscar Productos</label>
                  <div className="search-product-group">
                    <input
                      type="text"
                      value={searchProduct}
                      onChange={(e) => setSearchProduct(e.target.value)}
                      placeholder="Escribe para buscar productos..."
                    />
                  </div>
                </div>

                {/* Tabla de productos para seleccionar múltiples */}
                <div className="modal-products-list">
                  <h4>
                    Productos disponibles 
                    <span className="selected-count">
                      ({selectedProducts.length} seleccionados)
                    </span>
                  </h4>
                  
                  {modalFilteredProducts.length === 0 ? (
                    <div className="no-products-found">
                      <p>No se encontraron productos con ese nombre</p>
                    </div>
                  ) : (
                    <div className="table-responsive-container">
                      <table className="modal-products-table">
                        <thead>
                          <tr>
                            <th></th>
                            <th>Nombre</th>
                            <th>Stock</th>
                            <th>Precio</th>
                            <th>Cantidad</th>
                            <th>Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {modalFilteredProducts.map((product) => {
                            const isSelected = isProductSelected(product.medicationID);
                            const selectedProduct = selectedProducts.find(p => p.medicationID === product.medicationID);
                            
                            return (
                              <tr 
                                key={product.medicationID}
                                className={`selectable-row ${isSelected ? 'selected' : ''}`}
                              >
                                <td>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleSelectProduct(product)}
                                  />
                                </td>
                                <td style={{ color: "black", fontWeight: "500" }}>
                                  {product.Name}
                                </td>
                                <td className={getStockClass(product.Amount)}>
                                  {product.Amount}
                                </td>
                                <td style={{ color: "black", fontWeight: "500" }}>
                                  {formatPrice(product.Price)}
                                </td>
                                <td>
                                  {isSelected ? (
                                    <input
                                      type="number"
                                      min="1"
                                      max={product.Amount}
                                      value={selectedProduct?.saleAmount || ""}
                                      onChange={(e) => updateProductQuantity(product.medicationID, e.target.value)}
                                      className="quantity-input"
                                    />
                                  ) : (
                                    <span className="not-selected">-</span>
                                  )}
                                </td>
                                <td>
                                  {isSelected ? (
                                    <button 
                                      className="btn-remove-product"
                                      onClick={() => removeProduct(product.medicationID)}
                                    >
                                      Quitar
                                    </button>
                                  ) : (
                                    <button 
                                      className="btn-select-product"
                                      onClick={() => handleSelectProduct(product)}
                                    >
                                      Agregar
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Resumen de productos seleccionados */}
                {selectedProducts.length > 0 && (
                  <div className="selected-products-summary">
                    <h4>Resumen de Venta</h4>
                    <div className="summary-table-container">
                      <table className="summary-table">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Precio Unit.</th>
                            <th>Subtotal</th>
                            <th>Nuevo Stock</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedProducts.map((product) => {
                            const amount = parseInt(product.saleAmount) || 0;
                            const subtotal = (parseFloat(product.Price) || 0) * amount;
                            const newStock = product.Amount - amount;
                            
                            return (
                              <tr key={product.medicationID}>
                                <td>{product.Name}</td>
                                <td>{amount}</td>
                                <td>{formatPrice(product.Price)}</td>
                                <td>{formatPrice(subtotal)}</td>
                                <td className={getStockClass(newStock)}>
                                  {newStock}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan="3" className="total-label">
                              <strong>Total a pagar:</strong>
                            </td>
                            <td colSpan="2" className="total-amount">
                              <strong>{formatPrice(calculateTotal())}</strong>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    
                    <div className="modal-actions">
                      <button 
                        className="btn-confirm" 
                        onClick={handleSellProducts}
                        disabled={isProcessingSale}
                      >
                        {isProcessingSale ? (
                          <>
                            <span className="processing-spinner"></span>
                            Procesando...
                          </>
                        ) : (
                          `Confirmar Venta (${selectedProducts.length} productos)`
                        )}
                      </button>
                      <button className="btn-cancel" onClick={() => setSelectedProducts([])}>
                        Limpiar selección
                      </button>
                      <button className="btn-secondary" onClick={closeModal}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Si no hay productos seleccionados */}
                {selectedProducts.length === 0 && (
                  <div className="modal-actions">
                    <button className="btn-cancel" onClick={closeModal}>
                      Cancelar
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Modal Aumentar Stock */}
            {modalOpen === "restock" && (
              <>
                <h3>Aumentar Stock</h3>
                <div className="form-group">
                  <label>Buscar Producto</label>
                  <div className="search-product-group">
                    <input
                      type="text"
                      value={searchProduct}
                      onChange={(e) => setSearchProduct(e.target.value)}
                      placeholder="Escribe para buscar productos..."
                    />
                  </div>
                </div>

                {/* Tabla de productos para seleccionar */}
                {selectedProducts.length === 0 && (
                  <div className="modal-products-list">
                    <h4>Selecciona un producto:</h4>
                    {modalFilteredProducts.length === 0 ? (
                      <div className="no-products-found">
                        <p>No se encontraron productos con ese nombre</p>
                      </div>
                    ) : (
                      <div className="table-responsive-container">
                        <table className="modal-products-table">
                          <thead>
                            <tr>
                              <th>Nombre</th>
                              <th>Stock Actual</th>
                              <th>Precio</th>
                              <th>Seleccionar</th>
                            </tr>
                          </thead>
                          <tbody>
                            {modalFilteredProducts.map((product) => (
                              <tr 
                                key={product.medicationID}
                                className={`selectable-row ${selectedProducts.some(p => p.medicationID === product.medicationID) ? 'selected' : ''}`}
                                onClick={() => setSelectedProducts([product])}
                              >
                                <td style={{ color: "black", fontWeight: "500" }}>
                                  {product.Name}
                                </td>
                                <td className={getStockClass(product.Amount)}>
                                  {product.Amount}
                                </td>
                                <td style={{ color: "black", fontWeight: "500" }}>
                                  {formatPrice(product.Price)}
                                </td>
                                <td>
                                  <button 
                                    className="btn-select-product"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedProducts([product]);
                                    }}
                                  >
                                    Seleccionar
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Formulario para aumentar stock cuando se selecciona un producto */}
                {selectedProducts.length > 0 && (
                  <>
                    <div className="selected-product-info">
                      <div className="selected-product-header">
                        <h4>Producto seleccionado:</h4>
                        <button 
                          className="btn-change-product"
                          onClick={() => setSelectedProducts([])}
                        >
                          Cambiar producto
                        </button>
                      </div>
                      <div className="product-details">
                        <p><strong>Nombre:</strong> {selectedProducts[0].Name}</p>
                        <p><strong>Stock actual:</strong> {selectedProducts[0].Amount}</p>
                        <p><strong>Precio unitario:</strong> {formatPrice(selectedProducts[0].Price)}</p>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Cantidad a Añadir *</label>
                      <input
                        type="number"
                        value={restockAmount}
                        onChange={(e) => setRestockAmount(e.target.value)}
                        placeholder="Cantidad a añadir"
                        min="1"
                      />
                    </div>

                    {restockAmount && (
                      <div className="restock-summary">
                        <p><strong>Nuevo stock total:</strong> {selectedProducts[0].Amount + parseInt(restockAmount || 0)}</p>
                      </div>
                    )}

                    <div className="modal-actions">
                      <button 
                        className="btn-confirm" 
                        onClick={handleRestockProduct}
                        disabled={!restockAmount || parseInt(restockAmount) <= 0}
                      >
                        Aumentar Stock
                      </button>
                      <button className="btn-cancel" onClick={closeModal}>
                        Cancelar
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Sección de tabla principal */}
      <div className="medications-header">
        <h2>Medicamentos</h2>
        <div className="medications-tools">
          <div className="search-wrapper">
            <input
              className="search-box"
              placeholder="Buscar medicamento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="gray" viewBox="0 0 16 16">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
            </svg>
          </div>
          
          {search && (
            <button 
              className="btn-clear-filters" 
              onClick={() => setSearch("")}
              title="Limpiar búsqueda"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
              </svg>
            </button>
          )}
          
          <div className="medications-count">
            <span>{filtered.length}</span>
            <span>/</span>
            <span>{medications.length}</span>
          </div>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="action-buttons">
        <button className="btn-action-primary" onClick={() => setModalOpen("add")}>
          <span>➕</span>
          Agregar Nuevo Producto
        </button>
        <button className="btn-action-success" onClick={() => setModalOpen("sell")}>
          <span>💰</span>
          Realizar Venta
        </button>
        <button className="btn-action-warning" onClick={() => setModalOpen("restock")}>
          <span>📦</span>
          Aumentar Stock
        </button>
      </div>

      {/* Sección de tabla */}
      <div className="medications-section">
        <h3>Inventario de Medicamentos</h3>
        
        {filtered.length === 0 ? (
          <div className="no-results">
            <p>
              {search 
                ? "No se encontraron medicamentos que coincidan con la búsqueda." 
                : "No hay medicamentos registrados."}
            </p>
            <button className="btn-add-first" onClick={() => setModalOpen("add")}>
              Agregar primer producto
            </button>
          </div>
        ) : (
          <div className="table-responsive-container">
            <table className="medications-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nombre</th>
                  <th>Cantidad</th>
                  <th>Precio</th>
                  <th>Fecha de Expiración</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, index) => (
                  <tr key={m.medicationID}>
                    <td>{String(index + 1).padStart(2, '0')}</td>
                    <td style={{ color: "black", fontWeight: "500" }}>{m.Name || "Sin nombre"}</td>
                    <td className={getStockClass(m.Amount)}>
                      {m.Amount || 0}
                    </td>
                    <td style={{ color: "black", fontWeight: "500" }}>
                      {formatPrice(m.Price)}
                    </td>
                    <td className={getExpirationClass(m.ExpirationDate)}>
                      {m.ExpirationDate || "No especificada"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}